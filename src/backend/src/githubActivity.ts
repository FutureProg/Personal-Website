import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { GithubActivityData } from '@site/common/GithubActivityEvent';
import type { Octokit } from '@octokit/rest';
import { subscribeToPoller } from './githubPoller.js';

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

export function registerGithubActivityRoute(app: Hono, config: GithubActivityConfig): void {
  app.get('/github/activity', (c) => {
    return streamSSE(c, async (stream) => {
      // Join the shared poller: it replays the cached snapshot immediately and
      // streams updates. The connection stays open until the client aborts.
      const unsubscribe = subscribeToPoller(config, stream);

      await new Promise<void>((resolve) => {
        stream.onAbort(resolve);
      });

      unsubscribe();
    });
  });
}
