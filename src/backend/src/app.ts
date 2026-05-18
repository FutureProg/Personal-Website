import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { Hono } from 'hono';
import { Octokit } from '@octokit/rest';
import { registerGithubActivityRoute, type GithubActivityConfig } from './githubActivity.js';

export function createApp(options?: { githubActivity?: GithubActivityConfig }) {
  const app = new Hono().basePath('/api');
  app.use(logger());
  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

  app.get('/status', (c) => {
    return c.json({ status: 'ok' });
  });

  const githubConfig: GithubActivityConfig = options?.githubActivity ?? {
    client: new Octokit({ auth: process.env.GITHUB_TOKEN }),
    username: process.env.GITHUB_USERNAME ?? '',
    pollIntervalMs: Number(process.env.GITHUB_POLL_INTERVAL_MS) || 60_000,
  };

  registerGithubActivityRoute(app, githubConfig);

  return app;
}
