import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { GithubActivityData, GithubActivityEvent } from '@site/common/GithubActivityEvent';
import type { Octokit } from '@octokit/rest';

export interface GithubClient {
  rest: {
    activity: {
      listPublicEventsForUser: Octokit['rest']['activity']['listPublicEventsForUser'];
    };
  };
}

export interface GithubActivityConfig {
  client: GithubClient;
  username: string;
  pollIntervalMs: number;
}

type PushPayload = {
  commits?: Array<{ sha: string; message: string }>;
};

type RawEvent = {
  type: string | null;
  id: string;
  repo: { name: string; url: string };
  payload: unknown;
  created_at: string | null;
};

export function extractActivity(events: RawEvent[]): GithubActivityData[] {
  const byRepo = new Map<string, GithubActivityData>();

  for (const event of events) {
    if (event.type !== 'PushEvent') continue;
    const repoName = event.repo.name;
    if (byRepo.has(repoName)) continue;

    const payload = event.payload as PushPayload;
    const commits = payload.commits ?? [];
    const latestCommit = commits[commits.length - 1];
    if (!latestCommit) continue;

    byRepo.set(repoName, {
      repository: {
        name: repoName.split('/')[1] ?? repoName,
        url: `https://github.com/${repoName}`,
      },
      commit: {
        sha: latestCommit.sha,
        message: latestCommit.message,
        url: `https://github.com/${repoName}/commit/${latestCommit.sha}`,
      },
      timestamp: event.created_at ?? new Date().toISOString(),
    });
  }

  return Array.from(byRepo.values());
}

function isRateLimitError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    (err as { status: number }).status === 403
  );
}

export function registerGithubActivityRoute(app: Hono, config: GithubActivityConfig): void {
  app.get('/github/activity', (c) => {
    return streamSSE(c, async (stream) => {
      let aborted = false;
      stream.onAbort(() => {
        aborted = true;
      });

      const knownShas = new Set<string>();

      // Initial fetch
      let initialData: GithubActivityData[];
      try {
        const { data: events } = await config.client.rest.activity.listPublicEventsForUser({
          username: config.username,
          per_page: 100,
        });
        const allActivity = extractActivity(events);
        initialData = allActivity.slice(0, 5);
        for (const item of initialData) {
          knownShas.add(item.commit.sha);
        }
      } catch (err) {
        const errorEvent: GithubActivityEvent = {
          type: 'error',
          data: {
            message: isRateLimitError(err)
              ? 'GitHub API rate limit exceeded'
              : 'Failed to fetch GitHub activity',
          },
        };
        console.debug('Error fetching initial GitHub activity:', err);
        await stream.writeSSE({ data: JSON.stringify(errorEvent) });
        return;
      }

      const initialEvent: GithubActivityEvent = { type: 'initial', data: initialData };
      await stream.writeSSE({ data: JSON.stringify(initialEvent) });

      // Poll loop
      while (!aborted) {
        await new Promise<void>((resolve) => setTimeout(resolve, config.pollIntervalMs));

        if (aborted) break;

        try {
          const { data: events } = await config.client.rest.activity.listPublicEventsForUser({
            username: config.username,
            per_page: 100,
          });

          const allActivity = extractActivity(events);

          for (const item of allActivity) {
            if (!knownShas.has(item.commit.sha)) {
              knownShas.add(item.commit.sha);
              const updateEvent: GithubActivityEvent = { type: 'update', data: item };
              await stream.writeSSE({ data: JSON.stringify(updateEvent) });
            }
          }
        } catch (err: unknown) {
          const errorEvent: GithubActivityEvent = {
            type: 'error',
            data: {
              message: isRateLimitError(err)
                ? 'GitHub API rate limit exceeded'
                : 'Failed to fetch GitHub activity',
            },
          };
          await stream.writeSSE({ data: JSON.stringify(errorEvent) });
          break;
        }
      }
    });
  });
}
