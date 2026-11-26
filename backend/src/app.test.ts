import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '@/app';

const app = createApp();

describe('API foundation', () => {
  it('reports health', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('sets security headers and hides the framework', async () => {
    const response = await request(app).get('/health');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('answers unknown routes with a structured 404', async () => {
    const response = await request(app).get('/nothing-here');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('refuses profile access without a token', async () => {
    const response = await request(app).get('/v1/me');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('refuses a forged token', async () => {
    const response = await request(app).get('/v1/me').set('Authorization', 'Bearer not.a.token');
    expect(response.status).toBe(401);
  });

  it('refuses oversized bodies before they reach a handler', async () => {
    const response = await request(app)
      .post('/health')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ padding: 'x'.repeat(200_000) }));
    expect(response.status).toBe(413);
  });

  it('refuses malformed JSON without crashing', async () => {
    const response = await request(app)
      .post('/health')
      .set('Content-Type', 'application/json')
      .send('{"broken":');
    expect(response.status).toBe(400);
  });
});
