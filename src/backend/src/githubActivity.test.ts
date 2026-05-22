import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import { extractActivity, registerGithubActivityRoute } from './githubActivity.js';
import type { GithubActivityEvent } from '@site/common/GithubActivityEvent';
import type { GithubClient, GithubActivityConfig } from './githubActivity.js';

// ── helpers ────────────────────────────────────────────────────────────────

function makePushEvent(
  repoName: string,
  sha: string,
  message = 'test commit',
  createdAt = '2024-01-01T00:00:00Z',
) {
  return {
    type: 'PushEvent',
    id: sha,
    repo: { name: repoName, url: `https://api.github.com/repos/${repoName}`, id: 1 },
    payload: { head: sha, commits: [{ sha, message }] },
    created_at: createdAt,
  };
}

function makeNonPushEvent(repoName: string) {
  return {
    type: 'WatchEvent',
    id: 'watch-1',
    repo: { name: repoName, url: '', id: 1 },
    payload: {},
    created_at: '2024-01-01T00:00:00Z',
  };
}

function makeMockClient(responses: Array<{ data: ReturnType<typeof makePushEvent>[] }>): GithubClient {
  let call = 0;
  return {
    rest: {
      activity: {
        listPublicEventsForUser: vi.fn(async () => {
          const response = responses[call] ?? responses[responses.length - 1]!;
          call++;
          return response;
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

// ── extractActivity ────────────────────────────────────────────────────────

describe('extractActivity', () => {
  it('returns an empty array when given no events', () => {
    expect(extractActivity([])).toEqual([]);
  });

  it('ignores non-PushEvent events', () => {
    const events = [makeNonPushEvent('user/repo-a')];
    expect(extractActivity(events)).toEqual([]);
  });

  it('ignores push events with no commits', () => {
    const event = {
      type: 'PushEvent',
      id: '1',
      repo: { name: 'user/repo', url: '', id: 1 },
      payload: { head: 'abc123', commits: [] },
      created_at: '2024-01-01T00:00:00Z',
    };
    expect(extractActivity([event])).toEqual([]);
  });

  it('extracts a single PushEvent correctly', () => {
    const event = makePushEvent('user/repo-a', 'abc123', 'feat: add feature', '2024-06-01T12:00:00Z');
    const result = extractActivity([event]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      repository: { name: 'repo-a', url: 'https://github.com/user/repo-a' },
      commit: {
        sha: 'abc123',
        message: 'feat: add feature',
        url: 'https://github.com/user/repo-a/commit/abc123',
      },
      timestamp: '2024-06-01T12:00:00Z',
    });
  });

  it('deduplicates by repository — keeps only the first (most recent) entry per repo', () => {
    const events = [
      makePushEvent('user/repo-a', 'sha-1', 'first'),
      makePushEvent('user/repo-a', 'sha-2', 'second'),
    ];
    const result = extractActivity(events);
    expect(result).toHaveLength(1);
    expect(result[0]?.commit.sha).toBe('sha-1');
  });

  it('returns multiple repositories when events span different repos', () => {
    const events = [
      makePushEvent('user/repo-a', 'sha-1'),
      makePushEvent('user/repo-b', 'sha-2'),
      makePushEvent('user/repo-c', 'sha-3'),
    ];
    const result = extractActivity(events);
    expect(result).toHaveLength(3);
  });
});

// ── GET /api/github/activity ───────────────────────────────────────────────

describe('GET /api/github/activity', () => {
  it('returns Content-Type: text/event-stream', async () => {
    const client = makeMockClient([{ data: [] }]);
    const app = createTestApp(client);

    const res = await app.request('/api/github/activity');

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toMatch(/text\/event-stream/);
    res.body?.cancel();
  });

  it('sends an initial event with the 5 most recent repositories', async () => {
    const events = [
      makePushEvent('user/repo-1', 'sha-1'),
      makePushEvent('user/repo-2', 'sha-2'),
      makePushEvent('user/repo-3', 'sha-3'),
      makePushEvent('user/repo-4', 'sha-4'),
      makePushEvent('user/repo-5', 'sha-5'),
      makePushEvent('user/repo-6', 'sha-6'), // should be excluded
    ];
    const client = makeMockClient([{ data: events }]);
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

  it('sends an initial event with fewer items when fewer than 5 repos are found', async () => {
    const events = [makePushEvent('user/repo-1', 'sha-1'), makePushEvent('user/repo-2', 'sha-2')];
    const client = makeMockClient([{ data: events }]);
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
        activity: {
          listPublicEventsForUser: vi.fn().mockRejectedValue(new Error('network error')),
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
        activity: {
          listPublicEventsForUser: vi.fn().mockRejectedValue(rateLimitError),
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

    const initialEvents = [makePushEvent('user/repo-a', 'sha-1')];
    const updatedEvents = [
      makePushEvent('user/repo-a', 'sha-1'),
      makePushEvent('user/repo-b', 'sha-2'),
    ];

    const client = makeMockClient([{ data: initialEvents }, { data: updatedEvents }]);
    const app = createTestApp(client, { pollIntervalMs: 1000 });

    const res = await app.request('/api/github/activity');
    const reader = res.body!.getReader();
    const buffer = { current: '' };

    // Grab the initial event (already buffered before any timers run)
    const initialEvent = await readNextSSEEvent(reader, buffer);
    expect(initialEvent!.type).toBe('initial');

    // Advance time to trigger the poll, flushing any pending microtasks
    await vi.advanceTimersByTimeAsync(1000);

    // Now read the update event
    const updateEvent = await readNextSSEEvent(reader, buffer);
    reader.cancel();

    expect(updateEvent!.type).toBe('update');
    if (updateEvent!.type === 'update') {
      expect(updateEvent!.data.repository.name).toBe('repo-b');
      expect(updateEvent!.data.commit.sha).toBe('sha-2');
    }

    vi.useRealTimers();
  });

  it('does not send an update event when poll returns no new commits', async () => {
    vi.useFakeTimers();

    const events = [makePushEvent('user/repo-a', 'sha-1')];
    const mockFn = vi.fn().mockResolvedValue({ data: events });
    const client: GithubClient = {
      rest: { activity: { listPublicEventsForUser: mockFn } },
    };
    const app = createTestApp(client, { pollIntervalMs: 500 });

    const res = await app.request('/api/github/activity');
    const reader = res.body!.getReader();
    const buffer = { current: '' };

    const initialEvent = await readNextSSEEvent(reader, buffer);
    expect(initialEvent!.type).toBe('initial');
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Advance past the poll interval — the loop fetches again but finds no new SHAs
    await vi.advanceTimersByTimeAsync(500);

    // The client was called a second time for the poll
    expect(mockFn).toHaveBeenCalledTimes(2);
    // No extra data was written (buffer still empty after consuming the initial event)
    expect(buffer.current).toBe('');

    reader.cancel();
    vi.useRealTimers();
  });

  it('sends an error event and stops polling when poll throws', async () => {
    vi.useFakeTimers();

    const initialEvents = [makePushEvent('user/repo-a', 'sha-1')];
    const client: GithubClient = {
      rest: {
        activity: {
          listPublicEventsForUser: vi
            .fn()
            .mockResolvedValueOnce({ data: initialEvents })
            .mockRejectedValue(new Error('poll failed')),
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
