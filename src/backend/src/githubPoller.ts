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
// True while a bootstrap()/poll() fetch is awaiting the GitHub client. Tracked
// separately from `pollTimer` so a resubscribe during an in-flight fetch can't
// race a second concurrent fetch/timer chain (see stopPolling()).
let inFlight = false;
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

/** Milliseconds to wait before retrying, derived from GitHub's reset headers. */
function getRateLimitResetDelay(err: unknown, fallbackMs: number): number {
  const headers = (err as { response?: { headers?: Record<string, string> } }).response?.headers;
  // 403 primary rate limit: x-ratelimit-reset is a Unix epoch (seconds).
  const reset = headers?.['x-ratelimit-reset'];
  if (reset) {
    const resetMs = parseInt(reset, 10) * 1000;
    return Math.max(0, resetMs - Date.now());
  }
  // 429 secondary rate limit: Retry-After is a delay in seconds.
  const retryAfter = headers?.['retry-after'];
  if (retryAfter) {
    return Math.max(0, parseInt(retryAfter, 10) * 1000);
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

/** True while the loop is running or a fetch it kicked off is still pending. */
function isPollingActive(): boolean {
  return pollTimer !== null || inFlight;
}

function startPolling(config: GithubActivityConfig): void {
  if (isPollingActive()) return;

  if (lastKnownData === null) {
    // Cold start: fetch once and broadcast it as the `initial` snapshot.
    void bootstrap(config);
  } else {
    // Warm restart after an idle period: just resume the loop.
    scheduleNextPoll(config);
  }
}

function stopPolling(): void {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  // An in-flight fetch is not cancelled here — it re-checks subscribers.size
  // once it resolves and stops itself if nobody is left. `isPollingActive()`
  // still reports true while `inFlight`, so a resubscribe that races an
  // in-flight fetch reuses it instead of starting a second concurrent one.
}

function scheduleNextPoll(config: GithubActivityConfig): void {
  pollTimer = setTimeout(() => void poll(config), config.pollIntervalMs);
}

// ── Polling ──────────────────────────────────────────────────────────────────

/** First fetch after a cold start: populates the cache and emits `initial`. */
async function bootstrap(config: GithubActivityConfig): Promise<void> {
  inFlight = true;
  let data: GithubActivityData[];
  try {
    data = await fetchRepoActivity(config.client, config.username);
  } catch (err) {
    inFlight = false;
    pollError = err as Error;
    // No cached data to fall back on; clients must be told.
    broadcast(errorEvent(err));
    // Schedule a retry so existing connections recover automatically.
    if (subscribers.size > 0) {
      const delay = isRateLimitError(err)
        ? getRateLimitResetDelay(err, config.pollIntervalMs)
        : config.pollIntervalMs;
      pollTimer = setTimeout(() => void bootstrap(config), delay);
    }
    return;
  }
  inFlight = false;
  lastKnownData = data;
  pollError = null;
  for (const item of data) knownShas.add(item.commit.sha);
  broadcast({ type: 'initial', data });
  if (subscribers.size > 0) scheduleNextPoll(config);
}

/** One steady-state poll: diff against known SHAs and fan out new commits. */
async function poll(config: GithubActivityConfig): Promise<void> {
  // The last subscriber may have left while the previous timer was pending.
  if (subscribers.size === 0) {
    stopPolling();
    return;
  }

  inFlight = true;
  let data: GithubActivityData[];
  try {
    data = await fetchRepoActivity(config.client, config.username);
  } catch (err) {
    inFlight = false;
    pollError = err as Error;
    // If a cached snapshot exists, serve it silently — clients already have
    // the last-known data and don't need to see transient failures.
    if (lastKnownData === null) {
      broadcast(errorEvent(err));
    }
    if (subscribers.size > 0) {
      const delay = isRateLimitError(err)
        ? getRateLimitResetDelay(err, config.pollIntervalMs)
        : config.pollIntervalMs;
      pollTimer = setTimeout(() => void poll(config), delay);
    } else {
      stopPolling();
    }
    return;
  }
  inFlight = false;

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
  // Return a copy of knownShas so callers can't mutate internal state.
  return { data: lastKnownData, shas: new Set(knownShas), error: pollError };
}

/** Resets all module state. Intended for test isolation. */
export function resetPoller(): void {
  stopPolling();
  inFlight = false;
  subscribers.clear();
  knownShas.clear();
  lastKnownData = null;
  pollError = null;
}
