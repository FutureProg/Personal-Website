import type { SSEStreamingApi } from 'hono/streaming';
import type { GithubActivityConfig } from './githubActivity.js';
import type { GithubActivityData, GithubActivityEvent } from '@site/common/GithubActivityEvent';
import { fetchRepoActivity } from './githubActivity.js';

/**
 * A single, process-wide poller shared by every SSE connection.
 *
 * The backend runs as one long-lived Node process (see ADR 0001), so module
 * scope is a sound place to coordinate: one poll loop serves all subscribers,
 * GitHub is hit at most once per interval regardless of viewer count, and the
 * loop stops entirely when the last connection drops.
 */

// ── Shared state ─────────────────────────────────────────────────────────────

const subscribers = new Set<SSEStreamingApi>();
let pollTimer: ReturnType<typeof setTimeout> | null = null;
let polling = false;
const knownShas = new Set<string>();
let lastKnownData: GithubActivityData[] | null = null;
let pollError: Error | null = null;

// ── Rate-limit helpers ───────────────────────────────────────────────────────

function isRateLimitError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null || !('status' in err)) return false;
  const status = (err as { status: number }).status;
  // 403 = primary rate limit; 429 = secondary (burst/concurrency) rate limit.
  return status === 403 || status === 429;
}

/** Milliseconds to wait before retrying, derived from GitHub's reset header. */
function getRateLimitResetDelay(err: unknown, fallbackMs: number): number {
  const headers = (err as { response?: { headers?: Record<string, string> } }).response?.headers;
  const reset = headers?.['x-ratelimit-reset'];
  if (reset) {
    const resetMs = parseInt(reset, 10) * 1000;
    return Math.max(0, resetMs - Date.now());
  }
  return fallbackMs;
}

function errorEvent(err: unknown): GithubActivityEvent {
  return {
    type: 'error',
    data: {
      message: isRateLimitError(err)
        ? 'GitHub API rate limit exceeded'
        : 'Failed to fetch GitHub activity',
    },
  };
}

// ── Fan-out ──────────────────────────────────────────────────────────────────

/** Writes an SSE event to one stream, swallowing errors from dead connections. */
function send(stream: SSEStreamingApi, event: GithubActivityEvent): void {
  void stream.writeSSE({ data: JSON.stringify(event) }).catch(() => {
    // The connection went away mid-write; it will be removed on abort.
  });
}

function broadcast(event: GithubActivityEvent): void {
  for (const stream of subscribers) send(stream, event);
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

/**
 * Subscribes a connection to the shared poller. Immediately replays the cached
 * snapshot (if any) as an `initial` event, starts the poll loop on the first
 * subscriber, and returns an unsubscribe function that stops the loop once the
 * last subscriber leaves.
 */
export function subscribeToPoller(
  config: GithubActivityConfig,
  stream: SSEStreamingApi,
): () => void {
  subscribers.add(stream);

  // Warm cache: a late joiner gets the current snapshot right away.
  if (lastKnownData !== null) {
    send(stream, { type: 'initial', data: lastKnownData });
  }

  startPolling(config);

  return () => {
    subscribers.delete(stream);
    if (subscribers.size === 0) stopPolling();
  };
}

export function startPolling(config: GithubActivityConfig): void {
  if (polling) return;
  polling = true;

  if (lastKnownData === null) {
    // Cold start: fetch once and broadcast it as the `initial` snapshot.
    void bootstrap(config);
  } else {
    // Warm restart after an idle period: just resume the loop.
    scheduleNextPoll(config);
  }
}

export function stopPolling(): void {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  polling = false;
}

function scheduleNextPoll(config: GithubActivityConfig): void {
  pollTimer = setTimeout(() => void poll(config), config.pollIntervalMs);
}

// ── Polling ──────────────────────────────────────────────────────────────────

/** First fetch after a cold start: populates the cache and emits `initial`. */
async function bootstrap(config: GithubActivityConfig): Promise<void> {
  try {
    const data = await fetchRepoActivity(config.client, config.username);
    lastKnownData = data;
    pollError = null;
    for (const item of data) knownShas.add(item.commit.sha);
    broadcast({ type: 'initial', data });
  } catch (err) {
    pollError = err as Error;
    broadcast(errorEvent(err));
    // Failed to start; allow a later connection to retry from scratch.
    polling = false;
    return;
  }
  if (subscribers.size > 0) scheduleNextPoll(config);
  else stopPolling();
}

/** One steady-state poll: diff against known SHAs and fan out new commits. */
async function poll(config: GithubActivityConfig): Promise<void> {
  // The last subscriber may have left while the previous timer was pending.
  if (subscribers.size === 0) {
    stopPolling();
    return;
  }

  let data: GithubActivityData[];
  try {
    data = await fetchRepoActivity(config.client, config.username);
  } catch (err) {
    pollError = err as Error;
    broadcast(errorEvent(err));
    // Stop the loop on error; a fresh connection restarts it. Rate-limit resets
    // are honoured if the loop is still wanted.
    if (isRateLimitError(err) && subscribers.size > 0) {
      polling = true;
      pollTimer = setTimeout(
        () => void poll(config),
        getRateLimitResetDelay(err, config.pollIntervalMs),
      );
    } else {
      stopPolling();
    }
    return;
  }

  // Re-check: a slow fetch may have outlived the last subscriber.
  if (subscribers.size === 0) {
    stopPolling();
    return;
  }

  const newItems = data.filter((item) => !knownShas.has(item.commit.sha));
  if (newItems.length > 0) {
    for (const item of newItems) knownShas.add(item.commit.sha);
    lastKnownData = data;
    pollError = null;
    for (const item of newItems) broadcast({ type: 'update', data: item });
  }

  scheduleNextPoll(config);
}

// ── Introspection / testing ──────────────────────────────────────────────────

export function getSnapshot(): {
  data: GithubActivityData[] | null;
  shas: Set<string>;
  error: Error | null;
} {
  return { data: lastKnownData, shas: knownShas, error: pollError };
}

/** Resets all module state. Intended for test isolation. */
export function resetPoller(): void {
  stopPolling();
  subscribers.clear();
  knownShas.clear();
  lastKnownData = null;
  pollError = null;
}
