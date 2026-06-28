import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import { fetchRepoActivity, registerGithubActivityRoute } from './githubActivity.js';
import type { GithubActivityEvent } from '@site/common/GithubActivityEvent';
import type { GithubClient, GithubActivityConfig } from './githubActivity.js';

// ── helpers ────────────────────────────────────────────────────────────────

function makeRepo(fullName: string, pushedAt = '2024-01-01T00:00:00Z', fork = false) {
  const [owner, name] = fullName.split('/');
  return {
    name,
    full_name: fullName,
    html_url: `https://github.com/${fullName}`,
    owner: { login: owner },
    pushed_at: pushedAt,
    fork,
  };
}

function makeCommit(sha: string, message = 'a commit', date = '2024-01-01T00:00:00Z') {
  return {
    sha,
    html_url: `https://github.com/commit/${sha}`,
    commit: { message, author: { date } },
  };
}

/**
 * Builds a mock GithubClient. `repoResponses` is the sequence of repo lists
 * returned by successive listForUser calls (the last entry repeats). `shaByRepo`
 * maps a repo's full_name to the latest commit SHA listCommits should return;
 * a repo absent from the map (or mapped to null) behaves like an empty repo.
 */
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
          const fullName = `${owner}/${repo}`;
          const sha = shaByRepo[fullName];
          if (!sha) {
            // Mirror GitHub's 409 for an empty repository.
            throw Object.assign(new Error('Git Repository is empty.'), { status: 409 });
          }
          return { data: [makeCommit(sha)] } as any;
        }),
      },
    },
  };
}

function createTestApp(
  client: GithubClient,
  options: Partial<Omit<GithubActivityConfig, 'client'>> = {},
): Hono {
  const app = new Hono().basePath('/api');
  registerGithubActivityRoute(app, {
    client,
    username: 'testuser',
    pollIntervalMs: options.pollIntervalMs ?? 60_000,
    ...options,
  });
  return app;
}

/**
 * Reads the next complete SSE event from the reader.
 * Returns null if the stream closes before a complete event is found.
 */
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
      if (dataLine) {
        return JSON.parse(dataLine.slice('data: '.length)) as GithubActivityEvent;
      }
    }
  }
}

// ── fetchRepoActivity ────────────────────────────────────────────────────────

describe('fetchRepoActivity', () => {
  it('returns an empty array when the user has no repos', async () => {
    const client = makeMockClient([[]], {});
    expect(await fetchRepoActivity(client, 'testuser')).toEqual([]);
  });

  it('maps a repo and its latest commit into activity data', async () => {
    const client = makeMockClient(
      [[makeRepo('user/repo-a', '2024-06-01T12:00:00Z')]],
      { 'user/repo-a': 'abc123' },
    );
    const result = await fetchRepoActivity(client, 'testuser');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      repository: { name: 'user/repo-a', url: 'https://github.com/user/repo-a' },
      commit: {
        sha: 'abc123',
        message: 'a commit',
        url: 'https://github.com/commit/abc123',
      },
      timestamp: '2024-06-01T12:00:00Z',
    });
  });

  it('skips empty repositories (listCommits 409)', async () => {
    const client = makeMockClient(
      [[makeRepo('user/repo-a'), makeRepo('user/empty')]],
      { 'user/repo-a': 'sha-1', 'user/empty': null },
    );
    const result = await fetchRepoActivity(client, 'testuser');
    expect(result).toHaveLength(1);
    expect(result[0]?.repository.name).toBe('user/repo-a');
  });

  it('caps the result at the requested limit', async () => {
    const repos = Array.from({ length: 8 }, (_, i) => makeRepo(`user/repo-${i}`));
    const shas = Object.fromEntries(repos.map((r, i) => [r.full_name, `sha-${i}`]));
    const client = makeMockClient([repos], shas);
    const result = await fetchRepoActivity(client, 'testuser', 5);
    expect(result).toHaveLength(5);
  });

  it('requests repos sorted by most-recently-pushed and includes forks', async () => {
    const client = makeMockClient([[makeRepo('user/repo-a')]], { 'user/repo-a': 'sha-1' });
    await fetchRepoActivity(client, 'testuser');
    expect(client.rest.repos.listForUser).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'testuser', sort: 'pushed', direction: 'desc', type: 'all' }),
    );
  });

  it('includes forked repositories in results', async () => {
    const client = makeMockClient(
      [[makeRepo('user/repo-a', '2024-05-01T00:00:00Z'), makeRepo('upstream/repo-b', '2024-06-01T00:00:00Z', true)]],
      { 'user/repo-a': 'sha-1', 'upstream/repo-b': 'sha-2' },
    );
    const result = await fetchRepoActivity(client, 'testuser');
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.repository.name)).toContain('upstream/repo-b');
  });
});

// ── GET /api/github/activity ───────────────────────────────────────────────

describe('GET /api/github/activity', () => {
  it('returns Content-Type: text/event-stream', async () => {
    const client = makeMockClient([[]], {});
    const app = createTestApp(client);

    const res = await app.request('/api/github/activity');

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toMatch(/text\/event-stream/);
    res.body?.cancel();
  });

  it('sends an initial event with up to 5 repositories', async () => {
    const repos = Array.from({ length: 6 }, (_, i) => makeRepo(`user/repo-${i}`));
    const shas = Object.fromEntries(repos.map((r, i) => [r.full_name, `sha-${i}`]));
    const client = makeMockClient([repos], shas);
    const app = createTestApp(client);

    const res = await app.request('/api/github/activity');
    const reader = res.body!.getReader();
    const buffer = { current: '' };

    const event = await readNextSSEEvent(reader, buffer);
    reader.cancel();

    expect(event).not.toBeNull();
    expect(event!.type).toBe('initial');
    if (event!.type === 'initial') {
      expect(event!.data).toHaveLength(5);
    }
  });

  it('sends an initial event with fewer items when fewer than 5 repos exist', async () => {
    const client = makeMockClient(
      [[makeRepo('user/repo-1'), makeRepo('user/repo-2')]],
      { 'user/repo-1': 'sha-1', 'user/repo-2': 'sha-2' },
    );
    const app = createTestApp(client);

    const res = await app.request('/api/github/activity');
    const reader = res.body!.getReader();
    const buffer = { current: '' };

    const event = await readNextSSEEvent(reader, buffer);
    reader.cancel();

    expect(event!.type).toBe('initial');
    if (event!.type === 'initial') {
      expect(event!.data).toHaveLength(2);
    }
  });

  it('sends an error event when the GitHub client throws', async () => {
    const client: GithubClient = {
      rest: {
        repos: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          listForUser: vi.fn().mockRejectedValue(new Error('network error')) as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          listCommits: vi.fn() as any,
        },
      },
    };
    const app = createTestApp(client);

    const res = await app.request('/api/github/activity');
    const reader = res.body!.getReader();
    const buffer = { current: '' };

    const event = await readNextSSEEvent(reader, buffer);
    reader.cancel();

    expect(event!.type).toBe('error');
    if (event!.type === 'error') {
      expect(event!.data.message).toMatch(/failed to fetch/i);
    }
  });

  it('sends a rate-limit error message on HTTP 403 from the GitHub client', async () => {
    const rateLimitError = Object.assign(new Error('rate limited'), { status: 403 });
    const client: GithubClient = {
      rest: {
        repos: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          listForUser: vi.fn().mockRejectedValue(rateLimitError) as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          listCommits: vi.fn() as any,
        },
      },
    };
    const app = createTestApp(client);

    const res = await app.request('/api/github/activity');
    const reader = res.body!.getReader();
    const buffer = { current: '' };

    const event = await readNextSSEEvent(reader, buffer);
    reader.cancel();

    expect(event!.type).toBe('error');
    if (event!.type === 'error') {
      expect(event!.data.message).toMatch(/rate limit/i);
    }
  });

  it('sends a rate-limit error message on HTTP 429 (secondary rate limit) from the GitHub client', async () => {
    const secondaryRateLimitError = Object.assign(new Error('secondary rate limited'), { status: 429 });
    const client: GithubClient = {
      rest: {
        repos: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          listForUser: vi.fn().mockRejectedValue(secondaryRateLimitError) as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          listCommits: vi.fn() as any,
        },
      },
    };
    const app = createTestApp(client);

    const res = await app.request('/api/github/activity');
    const reader = res.body!.getReader();
    const buffer = { current: '' };

    const event = await readNextSSEEvent(reader, buffer);
    reader.cancel();

    expect(event!.type).toBe('error');
    if (event!.type === 'error') {
      expect(event!.data.message).toMatch(/rate limit/i);
    }
  });

  it('sends an update event when a new commit appears on poll', async () => {
    vi.useFakeTimers();

    // Initial: repo-a at sha-1. Poll: repo-b pushed more recently at sha-2.
    const client = makeMockClient(
      [
        [makeRepo('user/repo-a')],
        [makeRepo('user/repo-b', '2024-02-01T00:00:00Z'), makeRepo('user/repo-a')],
      ],
      { 'user/repo-a': 'sha-1', 'user/repo-b': 'sha-2' },
    );
    const app = createTestApp(client, { pollIntervalMs: 1000 });

    const res = await app.request('/api/github/activity');
    const reader = res.body!.getReader();
    const buffer = { current: '' };

    const initialEvent = await readNextSSEEvent(reader, buffer);
    expect(initialEvent!.type).toBe('initial');

    await vi.advanceTimersByTimeAsync(1000);

    const updateEvent = await readNextSSEEvent(reader, buffer);
    reader.cancel();

    expect(updateEvent!.type).toBe('update');
    if (updateEvent!.type === 'update') {
      expect(updateEvent!.data.repository.name).toBe('user/repo-b');
      expect(updateEvent!.data.commit.sha).toBe('sha-2');
    }

    vi.useRealTimers();
  });

  it('does not send an update event when poll returns no new commits', async () => {
    vi.useFakeTimers();

    const client = makeMockClient([[makeRepo('user/repo-a')]], { 'user/repo-a': 'sha-1' });
    const app = createTestApp(client, { pollIntervalMs: 500 });

    const res = await app.request('/api/github/activity');
    const reader = res.body!.getReader();
    const buffer = { current: '' };

    const initialEvent = await readNextSSEEvent(reader, buffer);
    expect(initialEvent!.type).toBe('initial');
    expect(client.rest.repos.listForUser).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(500);

    expect(client.rest.repos.listForUser).toHaveBeenCalledTimes(2);
    expect(buffer.current).toBe('');

    reader.cancel();
    vi.useRealTimers();
  });

  it('sends an error event and stops polling when poll throws', async () => {
    vi.useFakeTimers();

    const listForUser = vi
      .fn()
      .mockResolvedValueOnce({ data: [makeRepo('user/repo-a')] })
      .mockRejectedValue(new Error('poll failed'));
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
    const app = createTestApp(client, { pollIntervalMs: 500 });

    const res = await app.request('/api/github/activity');
    const reader = res.body!.getReader();
    const buffer = { current: '' };

    const initialEvent = await readNextSSEEvent(reader, buffer);
    expect(initialEvent!.type).toBe('initial');

    await vi.advanceTimersByTimeAsync(500);

    const errorEvent = await readNextSSEEvent(reader, buffer);
    reader.cancel();

    expect(errorEvent!.type).toBe('error');

    vi.useRealTimers();
  });
});
