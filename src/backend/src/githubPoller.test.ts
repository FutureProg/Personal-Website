import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SSEStreamingApi } from 'hono/streaming';
import { subscribeToPoller, getSnapshot, resetPoller } from './githubPoller.js';
import { makeRepo, makeCommit, makeMockClient } from './githubPollerTestHelpers.js';
import type { GithubClient, GithubActivityConfig } from './githubActivity.js';
import type { GithubActivityEvent } from '@site/common/GithubActivityEvent';

// ── helpers ──────────────────────────────────────────────────────────────────

/** A stand-in for Hono's SSEStreamingApi that records the events written to it. */
function makeFakeStream() {
  const events: GithubActivityEvent[] = [];
  const stream = {
    writeSSE: vi.fn(async (msg: { data: string }) => {
      events.push(JSON.parse(msg.data) as GithubActivityEvent);
    }),
    onAbort: vi.fn(),
  };
  return { stream: stream as unknown as SSEStreamingApi, events };
}

function makeConfig(client: GithubClient, pollIntervalMs = 1_000_000): GithubActivityConfig {
  return { client, username: 'testuser', pollIntervalMs };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(() => {
  resetPoller();
});

afterEach(() => {
  resetPoller();
  vi.useRealTimers();
});

// ── unit: subscription & fan-out ─────────────────────────────────────────────

describe('githubPoller (unit)', () => {
  it('serves all concurrent subscribers from a single GitHub fetch', async () => {
    const client = makeMockClient([[makeRepo('user/repo-a')]], { 'user/repo-a': 'sha-1' });
    const config = makeConfig(client);
    const a = makeFakeStream();
    const b = makeFakeStream();

    subscribeToPoller(config, a.stream);
    subscribeToPoller(config, b.stream);

    await vi.waitFor(() => {
      expect(a.events.at(-1)?.type).toBe('initial');
      expect(b.events.at(-1)?.type).toBe('initial');
    });
    expect(client.rest.repos.listForUser).toHaveBeenCalledTimes(1);
  });

  it('replays the cached snapshot to a late joiner without a new fetch', async () => {
    const client = makeMockClient([[makeRepo('user/repo-a')]], { 'user/repo-a': 'sha-1' });
    const config = makeConfig(client);

    const a = makeFakeStream();
    subscribeToPoller(config, a.stream);
    await vi.waitFor(() => expect(a.events.at(-1)?.type).toBe('initial'));
    expect(client.rest.repos.listForUser).toHaveBeenCalledTimes(1);

    const b = makeFakeStream();
    subscribeToPoller(config, b.stream);
    await vi.waitFor(() => expect(b.events[0]?.type).toBe('initial'));
    expect(client.rest.repos.listForUser).toHaveBeenCalledTimes(1);
  });

  it('stops polling when the last subscriber unsubscribes', async () => {
    vi.useFakeTimers();
    const client = makeMockClient([[makeRepo('user/repo-a')]], { 'user/repo-a': 'sha-1' });
    const config = makeConfig(client, 1000);

    const a = makeFakeStream();
    const unsubscribe = subscribeToPoller(config, a.stream);
    await vi.advanceTimersByTimeAsync(0);
    expect(a.events.at(-1)?.type).toBe('initial');

    const callsBefore = (client.rest.repos.listForUser as ReturnType<typeof vi.fn>).mock.calls.length;
    unsubscribe();
    await vi.advanceTimersByTimeAsync(3000);

    expect(client.rest.repos.listForUser).toHaveBeenCalledTimes(callsBefore);
  });

  it('does not emit an update when a poll returns only known SHAs', async () => {
    vi.useFakeTimers();
    const client = makeMockClient([[makeRepo('user/repo-a')]], { 'user/repo-a': 'sha-1' });
    const config = makeConfig(client, 500);

    const a = makeFakeStream();
    subscribeToPoller(config, a.stream);
    await vi.advanceTimersByTimeAsync(0);

    await vi.advanceTimersByTimeAsync(500);
    await vi.advanceTimersByTimeAsync(500);

    expect((client.rest.repos.listForUser as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(1);
    expect(a.events.filter((e) => e.type === 'update')).toHaveLength(0);
  });

  it('does not reschedule when the last subscriber leaves during an in-flight poll', async () => {
    vi.useFakeTimers();
    const pending = deferred<{ data: ReturnType<typeof makeRepo>[] }>();
    let call = 0;
    const listForUser = vi.fn(async () => {
      call++;
      if (call === 1) return { data: [makeRepo('user/repo-a')] };
      return pending.promise; // the poll fetch hangs until we resolve it
    });
    const client: GithubClient = {
      rest: {
        repos: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          listForUser: listForUser as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          listCommits: vi.fn(async () => ({ data: [makeCommit('sha-1')] })) as any,
        },
      },
    };
    const config = makeConfig(client, 500);

    const a = makeFakeStream();
    const unsubscribe = subscribeToPoller(config, a.stream);
    await vi.advanceTimersByTimeAsync(0);
    expect(a.events.at(-1)?.type).toBe('initial');

    await vi.advanceTimersByTimeAsync(500); // fire the poll; it awaits `pending`
    expect(listForUser).toHaveBeenCalledTimes(2);

    unsubscribe(); // last subscriber leaves mid-fetch
    pending.resolve({ data: [makeRepo('user/repo-a')] });
    await vi.advanceTimersByTimeAsync(0);

    await vi.advanceTimersByTimeAsync(2000);
    expect(listForUser).toHaveBeenCalledTimes(2); // no further polls scheduled
    expect(a.events.filter((e) => e.type === 'update')).toHaveLength(0);
  });

  it('does not start a second concurrent fetch when the last subscriber leaves and a new one joins during an in-flight bootstrap', async () => {
    vi.useFakeTimers();
    const pending = deferred<{ data: ReturnType<typeof makeRepo>[] }>();
    const listForUser = vi.fn(async () => pending.promise);
    const client: GithubClient = {
      rest: {
        repos: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          listForUser: listForUser as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          listCommits: vi.fn(async () => ({ data: [makeCommit('sha-1')] })) as any,
        },
      },
    };
    const config = makeConfig(client, 500);

    const a = makeFakeStream();
    const unsubscribeA = subscribeToPoller(config, a.stream);
    await vi.advanceTimersByTimeAsync(0);
    expect(listForUser).toHaveBeenCalledTimes(1); // bootstrap fetch in flight

    unsubscribeA(); // last subscriber leaves mid-fetch

    const b = makeFakeStream();
    const unsubscribeB = subscribeToPoller(config, b.stream); // resubscribe before it resolves
    await vi.advanceTimersByTimeAsync(0);

    expect(listForUser).toHaveBeenCalledTimes(1); // must NOT start a second concurrent fetch

    pending.resolve({ data: [makeRepo('user/repo-a')] });
    await vi.advanceTimersByTimeAsync(0);

    expect(listForUser).toHaveBeenCalledTimes(1); // still just the one fetch
    expect(b.events.filter((e) => e.type === 'initial')).toHaveLength(1); // no duplicate broadcast

    unsubscribeB();
  });

  it('backs off using the x-ratelimit-reset header on a 403, not the poll interval', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    const resetEpoch = Math.floor(Date.now() / 1000) + 2; // ~2s in the future

    let call = 0;
    const listForUser = vi.fn(async () => {
      call++;
      if (call === 1) return { data: [makeRepo('user/repo-a')] };
      if (call === 2) {
        throw Object.assign(new Error('rate limited'), {
          status: 403,
          response: { headers: { 'x-ratelimit-reset': String(resetEpoch) } },
        });
      }
      return { data: [makeRepo('user/repo-b', '2024-02-01T00:00:00Z'), makeRepo('user/repo-a')] };
    });
    const client: GithubClient = {
      rest: {
        repos: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          listForUser: listForUser as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          listCommits: vi.fn(async ({ owner, repo }: { owner: string; repo: string }) => {
            const sha = `${owner}/${repo}` === 'user/repo-b' ? 'sha-2' : 'sha-1';
            return { data: [makeCommit(sha)] };
          }) as any,
        },
      },
    };
    const config = makeConfig(client, 100); // tiny interval to prove backoff ignores it

    const a = makeFakeStream();
    subscribeToPoller(config, a.stream);
    await vi.advanceTimersByTimeAsync(0);

    await vi.advanceTimersByTimeAsync(100); // poll #2 -> 403
    // No error event: cached snapshot is silently retained.
    expect(a.events.filter((e) => e.type === 'error')).toHaveLength(0);
    const callsAfterError = listForUser.mock.calls.length;

    await vi.advanceTimersByTimeAsync(500); // past the 100ms interval, before the ~2s reset
    expect(listForUser).toHaveBeenCalledTimes(callsAfterError); // retry has NOT fired yet

    await vi.advanceTimersByTimeAsync(1500); // now past the reset
    expect(listForUser.mock.calls.length).toBeGreaterThan(callsAfterError); // retry fired after reset
    expect(a.events.at(-1)?.type).toBe('update');
  });

  it('backs off using the Retry-After header on a 429', async () => {
    vi.useFakeTimers();

    let call = 0;
    const listForUser = vi.fn(async () => {
      call++;
      if (call === 1) return { data: [makeRepo('user/repo-a')] };
      if (call === 2) {
        throw Object.assign(new Error('secondary rate limited'), {
          status: 429,
          response: { headers: { 'retry-after': '2' } }, // wait 2 seconds
        });
      }
      return { data: [makeRepo('user/repo-b', '2024-02-01T00:00:00Z'), makeRepo('user/repo-a')] };
    });
    const client: GithubClient = {
      rest: {
        repos: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          listForUser: listForUser as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          listCommits: vi.fn(async ({ owner, repo }: { owner: string; repo: string }) => {
            const sha = `${owner}/${repo}` === 'user/repo-b' ? 'sha-2' : 'sha-1';
            return { data: [makeCommit(sha)] };
          }) as any,
        },
      },
    };
    const config = makeConfig(client, 100); // tiny interval to prove backoff ignores it

    const a = makeFakeStream();
    subscribeToPoller(config, a.stream);
    await vi.advanceTimersByTimeAsync(0);

    await vi.advanceTimersByTimeAsync(100); // poll #2 -> 429
    expect(a.events.filter((e) => e.type === 'error')).toHaveLength(0);
    const callsAfterError = listForUser.mock.calls.length;

    await vi.advanceTimersByTimeAsync(500); // past the 100ms interval, before the 2s retry-after
    expect(listForUser).toHaveBeenCalledTimes(callsAfterError); // retry has NOT fired yet

    await vi.advanceTimersByTimeAsync(1500); // now past Retry-After
    expect(listForUser.mock.calls.length).toBeGreaterThan(callsAfterError); // retry fired
    expect(a.events.at(-1)?.type).toBe('update');
  });

  it('silently retries on a transient poll error without emitting an error event', async () => {
    vi.useFakeTimers();
    let call = 0;
    const listForUser = vi.fn(async () => {
      call++;
      if (call === 1) return { data: [makeRepo('user/repo-a')] };
      if (call === 2) throw Object.assign(new Error('network blip'), { status: 500 });
      return { data: [makeRepo('user/repo-b', '2024-02-01T00:00:00Z'), makeRepo('user/repo-a')] };
    });
    const client: GithubClient = {
      rest: {
        repos: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          listForUser: listForUser as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          listCommits: vi.fn(async ({ owner, repo }: { owner: string; repo: string }) => {
            const sha = `${owner}/${repo}` === 'user/repo-b' ? 'sha-2' : 'sha-1';
            return { data: [makeCommit(sha)] };
          }) as any,
        },
      },
    };
    const config = makeConfig(client, 100);

    const a = makeFakeStream();
    subscribeToPoller(config, a.stream);
    await vi.advanceTimersByTimeAsync(0);
    expect(a.events.at(-1)?.type).toBe('initial');

    await vi.advanceTimersByTimeAsync(100); // poll #2 -> 500 error
    expect(a.events.filter((e) => e.type === 'error')).toHaveLength(0); // no error event

    await vi.advanceTimersByTimeAsync(100); // retry fires
    expect(listForUser).toHaveBeenCalledTimes(3);
    expect(a.events.at(-1)?.type).toBe('update'); // recovered
  });

  it('emits an error and retries when bootstrap fails with no cached data', async () => {
    vi.useFakeTimers();
    let call = 0;
    const listForUser = vi.fn(async () => {
      call++;
      if (call === 1) throw Object.assign(new Error('network blip'), { status: 500 });
      return { data: [makeRepo('user/repo-a')] };
    });
    const client: GithubClient = {
      rest: {
        repos: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          listForUser: listForUser as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          listCommits: vi.fn(async () => ({ data: [makeCommit('sha-1')] })) as any,
        },
      },
    };
    const config = makeConfig(client, 500);

    const a = makeFakeStream();
    subscribeToPoller(config, a.stream);
    await vi.advanceTimersByTimeAsync(0);

    // Bootstrap failed: error is emitted (no stale data to serve) and retry is scheduled.
    expect(a.events.at(-1)?.type).toBe('error');

    await vi.advanceTimersByTimeAsync(500); // retry fires
    expect(listForUser).toHaveBeenCalledTimes(2);
    expect(a.events.at(-1)?.type).toBe('initial'); // recovered
  });

  it('exposes current data, SHAs, and error through getSnapshot', async () => {
    const client = makeMockClient([[makeRepo('user/repo-a')]], { 'user/repo-a': 'sha-1' });
    const config = makeConfig(client);

    expect(getSnapshot().data).toBeNull();

    const a = makeFakeStream();
    subscribeToPoller(config, a.stream);
    await vi.waitFor(() => expect(a.events.at(-1)?.type).toBe('initial'));

    const snap = getSnapshot();
    expect(snap.data).toHaveLength(1);
    expect(snap.shas.has('sha-1')).toBe(true);
    expect(snap.error).toBeNull();
  });

  it('returns a snapshot of shas, not a live reference', async () => {
    const client = makeMockClient([[makeRepo('user/repo-a')]], { 'user/repo-a': 'sha-1' });
    const config = makeConfig(client);

    const a = makeFakeStream();
    subscribeToPoller(config, a.stream);
    await vi.waitFor(() => expect(a.events.at(-1)?.type).toBe('initial'));

    const snap = getSnapshot();
    // The poller may add more SHAs later; the snapshot should not reflect that.
    resetPoller();
    expect(snap.shas.has('sha-1')).toBe(true); // snapshot is frozen, not cleared
  });

  it('clears all state and stops the loop on resetPoller', async () => {
    vi.useFakeTimers();
    const client = makeMockClient([[makeRepo('user/repo-a')]], { 'user/repo-a': 'sha-1' });
    const config = makeConfig(client, 500);

    const a = makeFakeStream();
    subscribeToPoller(config, a.stream);
    await vi.advanceTimersByTimeAsync(0);
    expect(getSnapshot().data).not.toBeNull();

    resetPoller();
    expect(getSnapshot().data).toBeNull();
    expect(getSnapshot().shas.size).toBe(0);
    expect(getSnapshot().error).toBeNull();

    const callsBefore = (client.rest.repos.listForUser as ReturnType<typeof vi.fn>).mock.calls.length;
    await vi.advanceTimersByTimeAsync(2000);
    expect(client.rest.repos.listForUser).toHaveBeenCalledTimes(callsBefore);
  });
});
