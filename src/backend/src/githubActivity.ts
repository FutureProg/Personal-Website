import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { GithubActivityData, GithubActivityEvent } from '@site/common/GithubActivityEvent';
import type { Octokit } from '@octokit/rest';

export interface GithubClient {
  rest: {
    repos: {
      listForUser: Octokit['rest']['repos']['listForUser'];
      listCommits: Octokit['rest']['repos']['listCommits'];
    };
  };
}

export interface GithubActivityConfig {
  client: GithubClient;
  username: string;
  pollIntervalMs: number;
}

/** Number of repositories surfaced by the activity stream. */
const REPO_LIMIT = 5;

/**
 * Builds the activity list from the user's most-recently-pushed repositories.
 */
export async function fetchRepoActivity(
  client: GithubClient,
  username: string,
  limit: number = REPO_LIMIT,
): Promise<GithubActivityData[]> {
  const { data: repos } = await client.rest.repos.listForUser({
    username,
    sort: 'pushed',
    direction: 'desc',
    per_page: limit,
    type: 'owner',
  });

  const activity = await Promise.all(
    repos.map(async (repo): Promise<GithubActivityData | null> => {
      let commit;
      try {
        const { data: commits } = await client.rest.repos.listCommits({          
          owner: repo.owner.login,
          repo: repo.name,
          author: username,
          per_page: 1,
        });
        commit = commits[0];
      } catch (err) {
        if ((err as { status?: number }).status !== 409) {
          console.debug(`Skipping ${repo.full_name}:`, err);
        }
        return null;
      }
      if (!commit) return null;

      return {
        repository: {
          name: repo.full_name,
          url: repo.html_url,
        },
        commit: {
          sha: commit.sha,
          message: commit.commit.message,
          url: commit.html_url,
        },
        timestamp: repo.pushed_at ?? commit.commit.author?.date ?? new Date().toISOString(),
      };
    }),
  );

  return activity.filter((item): item is GithubActivityData => item !== null);
}

function isRateLimitError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null || !('status' in err)) return false;
  const status = (err as { status: number }).status;
  // 403 = primary rate limit; 429 = secondary (burst/concurrency) rate limit.
  return status === 403 || status === 429;
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
        initialData = await fetchRepoActivity(config.client, config.username);
        console.log(`Fetched ${initialData.length} repositories for user ${config.username}`);
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
          const allActivity = await fetchRepoActivity(config.client, config.username);

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
