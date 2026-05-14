import { serve } from '@hono/node-server'
import { logger} from 'hono/logger';
import { cors } from 'hono/cors';
import { Hono } from 'hono'

const app = new Hono().basePath('/api');
app.use(logger());
app.use(cors());

app.get('/status', (c) => {
  return c.json({ status: 'ok' })
});

serve({
  fetch: app.fetch,
  port: Number(process.env.PORT) || 3001
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
});
