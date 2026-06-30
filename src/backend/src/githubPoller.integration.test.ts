import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { registerGithubActivityRoute } from './githubActivity.js';
import { resetPoller } from './githubPoller.js';
import type { GithubClient } from './githubActivity.js';
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

function createTestApp(client: GithubClient, pollIntervalMs: number): Hono {
  const app = new Hono().basePath('/api');
  registerGithubActivityRoute(app, { client, username: 'testuser', pollIntervalMs });
  return app;
}

async function readNextSSEEvent(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  buffer: { current: string },
): Promise<GithubActivityEvent | null> {
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) return null;
    buffer.current += decoder.decode(value, { stream: true });
    const idx = buffer.current.indexOf('\n\n');
    if (idx !== -1) {
      const eventText = buffer.current.slice(0, idx);
      buffer.current = buffer.current.slice(idx + 2);
      const dataLine = eventText.split('\n').find((l) => l.startsWith('data: '));
      if (dataLine) return JSON.parse(dataLine.slice('data: '.length)) as GithubActivityEvent;
    }
  }
}

beforeEach(() => {
  resetPoller();
});

afterEach(() => {
  resetPoller();
  vi.useRealTimers();
});

// ── integration: through the SSE route ───────────────────────────────────────

describe('githubPoller (integration via route)', () => {
  it('serves two concurrent connections with one fetch per interval', async () => {
    vi.useFakeTimers();
    const client = makeMockClient([[makeRepo('user/repo-a')]], { 'user/repo-a': 'sha-1' });
    const app = createTestApp(client, 1000);

    const res1 = await app.request('/api/github/activity');
    const r1 = res1.body!.getReader();
    const b1 = { current: '' };
    expect((await readNextSSEEvent(r1, b1))!.type).toBe('initial');

    const res2 = await app.request('/api/github/activity');
    const r2 = res2.body!.getReader();
    const b2 = { current: '' };
    expect((await readNextSSEEvent(r2, b2))!.type).toBe('initial');

    expect(client.rest.repos.listForUser).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(client.rest.repos.listForUser).toHaveBeenCalledTimes(2); // shared poll, not one-per-connection

    r1.cancel();
    r2.cancel();
  });

  it('gives a second connection the snapshot instantly with no extra fetch', async () => {
    const client = makeMockClient([[makeRepo('user/repo-a')]], { 'user/repo-a': 'sha-1' });
    const app = createTestApp(client, 1_000_000);

    const res1 = await app.request('/api/github/activity');
    const r1 = res1.body!.getReader();
    const b1 = { current: '' };
    expect((await readNextSSEEvent(r1, b1))!.type).toBe('initial');
    expect(client.rest.repos.listForUser).toHaveBeenCalledTimes(1);

    const res2 = await app.request('/api/github/activity');
    const r2 = res2.body!.getReader();
    const b2 = { current: '' };
    expect((await readNextSSEEvent(r2, b2))!.type).toBe('initial');
    expect(client.rest.repos.listForUser).toHaveBeenCalledTimes(1);

    r1.cancel();
    r2.cancel();
  });

  it('keeps polling for the remaining connection when one of two closes', async () => {
    vi.useFakeTimers();
    const client = makeMockClient([[makeRepo('user/repo-a')]], { 'user/repo-a': 'sha-1' });
    const app = createTestApp(client, 1000);

    const res1 = await app.request('/api/github/activity');
    const r1 = res1.body!.getReader();
    const b1 = { current: '' };
    expect((await readNextSSEEvent(r1, b1))!.type).toBe('initial');

    const res2 = await app.request('/api/github/activity');
    const r2 = res2.body!.getReader();
    const b2 = { current: '' };
    expect((await readNextSSEEvent(r2, b2))!.type).toBe('initial');

    await r1.cancel(); // close one connection
    await vi.advanceTimersByTimeAsync(0);

    await vi.advanceTimersByTimeAsync(1000);
    expect(client.rest.repos.listForUser).toHaveBeenCalledTimes(2); // still polling for conn 2

    r2.cancel();
  });

  it('stops polling when the last connection closes', async () => {
    vi.useFakeTimers();
    const client = makeMockClient([[makeRepo('user/repo-a')]], { 'user/repo-a': 'sha-1' });
    const app = createTestApp(client, 1000);

    const res1 = await app.request('/api/github/activity');
    const r1 = res1.body!.getReader();
    const b1 = { current: '' };
    expect((await readNextSSEEvent(r1, b1))!.type).toBe('initial');
    expect(client.rest.repos.listForUser).toHaveBeenCalledTimes(1);

    await r1.cancel();
    await vi.advanceTimersByTimeAsync(0);

    const callsBefore = (client.rest.repos.listForUser as unknown as ReturnType<typeof vi.fn>).mock.calls.length;
    await vi.advanceTimersByTimeAsync(3000);
    expect(client.rest.repos.listForUser).toHaveBeenCalledTimes(callsBefore);
  });
});
