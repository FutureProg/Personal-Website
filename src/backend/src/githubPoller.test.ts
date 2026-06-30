import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SSEStreamingApi } from 'hono/streaming';
import { subscribeToPoller, getSnapshot, resetPoller } from './githubPoller.js';
import type { GithubClient, GithubActivityConfig } from './githubActivity.js';
import type { GithubActivityEvent } from '@site/common/GithubActivityEvent';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeRepo(fullName: string, pushedAt = '2024-01-01T00:00:00Z') {
  const [owner, name] = fullName.split('/');
  return {
    name,
    full_name: fullName,
    html_url: `https://github.com/${fullName}`,
    owner: { login: owner },
    pushed_at: pushedAt,
    fork: false,
  };
}

function makeCommit(sha: string, message = 'a commit', date = '2024-01-01T00:00:00Z') {
  return { sha, html_url: `https://github.com/commit/${sha}`, commit: { message, author: { date } } };
}

function makeMockClient(
  repoResponses: Array<ReturnType<typeof makeRepo>[]>,
  shaByRepo: Record<string, string | null>,
): GithubClient {
  let call = 0;
  return {
    rest: {
      repos: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        listForUser: vi.fn(async () => {
          const data = repoResponses[call] ?? repoResponses[repoResponses.length - 1]!;
          call++;
          return { data } as any;
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        listCommits: vi.fn(async ({ owner, repo }: { owner: string; repo: string }) => {
          const sha = shaByRepo[`${owner}/${repo}`];
          if (!sha) throw Object.assign(new Error('Git Repository is empty.'), { status: 409 });
          return { data: [makeCommit(sha)] } as any;
        }),
      } as any,
    },
  };
}

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
    expect(a.events.at(-1)?.type).toBe('error');
    const callsAfterError = listForUser.mock.calls.length;

    await vi.advanceTimersByTimeAsync(500); // past the 100ms interval, before the ~2s reset
    expect(listForUser).toHaveBeenCalledTimes(callsAfterError); // retry has NOT fired yet

    await vi.advanceTimersByTimeAsync(1500); // now past the reset
    expect(listForUser.mock.calls.length).toBeGreaterThan(callsAfterError); // retry fired after reset
    expect(a.events.at(-1)?.type).toBe('update');
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
