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
 *
 * The previous implementation read the public *events* feed and counted only
 * `PushEvent`s, deduped by repo. For a focused contributor whose recent pushes
 * cluster into a handful of repos, that feed contains fewer than 5 distinct
 * repositories — so the stream listed fewer than 5 no matter what. Listing
 * repositories sorted by `pushed` reliably yields up to `limit` repos, and the
 * per-repo commit lookup lets us include the real commit message (the events
 * payload never carried it).
 */
export async function fetchRepoActivity(
  client: GithubClient,
  username: string,
  limit: number = REPO_LIMIT,
): Promise<GithubActivityData[]> {
  // Fetch a few extra repos as headroom: some may be empty (no commits) and
  // get skipped below, and we still want to fill `limit` slots when possible.
  // type: 'all' ensures forked repositories are included alongside owned ones.
  const { data: repos } = await client.rest.repos.listForUser({
    username,
    sort: 'pushed',
    direction: 'desc',
    per_page: limit + 3,
    type: 'all',
  });

  const activity = await Promise.all(
    repos.map(async (repo): Promise<GithubActivityData | null> => {
      let commit;
      try {
        const { data: commits } = await client.rest.repos.listCommits({
          owner: repo.owner.login,
          repo: repo.name,
          per_page: 1,
        });
        commit = commits[0];
      } catch {
        // Empty repository (GitHub returns 409) or no accessible commits.
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

  return activity.filter((item): item is GithubActivityData => item !== null).slice(0, limit);
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
