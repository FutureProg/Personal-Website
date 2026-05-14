import { describe, it, expect, afterEach } from 'vitest';
import { createApp } from './app.js';

describe('GET /api/status', () => {
  it('returns 200 with ok status', async () => {
    const app = createApp();
    const res = await app.request('/api/status');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });
});

describe('CORS', () => {
  const savedCorsOrigin = process.env.CORS_ORIGIN;

  afterEach(() => {
    if (savedCorsOrigin === undefined) {
      delete process.env.CORS_ORIGIN;
    } else {
      process.env.CORS_ORIGIN = savedCorsOrigin;
    }
  });

  it('allows all origins when CORS_ORIGIN is not set', async () => {
    delete process.env.CORS_ORIGIN;
    const app = createApp();
    const res = await app.request('/api/status', {
      headers: { Origin: 'https://example.com' },
    });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('restricts to CORS_ORIGIN when set', async () => {
    process.env.CORS_ORIGIN = 'https://mysite.com';
    const app = createApp();
    const res = await app.request('/api/status', {
      headers: { Origin: 'https://mysite.com' },
    });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://mysite.com');
  });
});
