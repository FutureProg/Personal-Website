import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { Hono } from 'hono';

export function createApp() {
  const app = new Hono().basePath('/api');
  app.use(logger());
  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

  app.get('/status', (c) => {
    return c.json({ status: 'ok' });
  });

  return app;
}
