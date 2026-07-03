import { vi } from 'vitest';
import type { GithubClient } from './githubActivity.js';

export function makeRepo(fullName: string, pushedAt = '2024-01-01T00:00:00Z', fork = false) {
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

export function makeCommit(sha: string, message = 'a commit', date = '2024-01-01T00:00:00Z') {
  return { sha, html_url: `https://github.com/commit/${sha}`, commit: { message, author: { date } } };
}

/**
 * Builds a mock GithubClient. `repoResponses` is the sequence of repo lists
 * returned by successive listForUser calls (the last entry repeats). `shaByRepo`
 * maps a repo's full_name to the latest commit SHA listCommits should return;
 * a repo absent from the map (or mapped to null) behaves like an empty repo.
 */
export function makeMockClient(
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
          if (!sha) {
            // Mirror GitHub's 409 for an empty repository.
            throw Object.assign(new Error('Git Repository is empty.'), { status: 409 });
          }
          return { data: [makeCommit(sha)] } as any;
        }),
      } as any,
    },
  };
}
