import type * as Jose from 'jose';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestUser, signAccessToken, testJwks } from '@/test/auth-tokens';

vi.mock('jose', async (importOriginal) => {
  const jose = await importOriginal<typeof Jose>();
  return { ...jose, createRemoteJWKSet: () => jose.createLocalJWKSet(testJwks) };
});

const { createApp } = await import('@/app');
const { prisma } = await import('@/lib/prisma');

const app = createApp();

const validProfile = { fullName: 'Adaeze Okafor', role: 'FAMILY', phone: '+234 801 234 5678' };

async function authHeader(user = createTestUser()) {
  return { user, header: { Authorization: `Bearer ${await signAccessToken(user)}` } };
}

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('profile', () => {
  it('asks a new account to finish its profile', async () => {
    const { header } = await authHeader();
    const response = await request(app).get('/v1/me').set(header);
    expect(response.status).toBe(404);
  });

  it('creates the profile with the identity from the token', async () => {
    const { user, header } = await authHeader();
    const response = await request(app).post('/v1/me').set(header).send(validProfile);

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      id: user.userId,
      email: user.email,
      fullName: validProfile.fullName,
      role: 'FAMILY',
    });
  });

  it('refuses to create a profile twice', async () => {
    const { header } = await authHeader();
    await request(app).post('/v1/me').set(header).send(validProfile);
    const response = await request(app).post('/v1/me').set(header).send(validProfile);
    expect(response.status).toBe(409);
  });

  it('refuses roles a user may not give themselves', async () => {
    const { header } = await authHeader();
    const response = await request(app)
      .post('/v1/me')
      .set(header)
      .send({ ...validProfile, role: 'PATIENT' });
    expect(response.status).toBe(400);
  });

  it('refuses fields the client does not control', async () => {
    const { header } = await authHeader();
    const response = await request(app)
      .post('/v1/me')
      .set(header)
      .send({ ...validProfile, id: createTestUser().userId, email: 'someone@else.test' });
    expect(response.status).toBe(400);
  });

  it('never returns another user’s profile', async () => {
    const owner = await authHeader();
    const stranger = await authHeader();
    await request(app).post('/v1/me').set(owner.header).send(validProfile);

    const response = await request(app).get('/v1/me').set(stranger.header);
    expect(response.status).toBe(404);
  });

  it('refuses an expired token', async () => {
    const user = createTestUser();
    const token = await signAccessToken(user, { expiresIn: '-5m' });
    const response = await request(app).get('/v1/me').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(401);
  });

  it('lets a user update only their own details', async () => {
    const { header } = await authHeader();
    await request(app).post('/v1/me').set(header).send(validProfile);

    const response = await request(app)
      .patch('/v1/me')
      .set(header)
      .send({ fullName: 'Adaeze N. Okafor' });

    expect(response.status).toBe(200);
    expect(response.body.data.fullName).toBe('Adaeze N. Okafor');
    expect(response.body.data.role).toBe('FAMILY');
  });

  it('refuses a role change through profile updates', async () => {
    const { header } = await authHeader();
    await request(app).post('/v1/me').set(header).send(validProfile);
    const response = await request(app).patch('/v1/me').set(header).send({ role: 'AGENCY_ADMIN' });
    expect(response.status).toBe(400);
  });
});
