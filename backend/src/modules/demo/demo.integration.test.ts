import '@/test/mock-jwks';

import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { signAccessToken } from '@/test/auth-tokens';
import { resetDatabase } from '@/test/reset-database';

const FAMILY_ID = 'a0000000-0000-4000-8000-000000000001';
const CAREGIVER_ID = 'a0000000-0000-4000-8000-000000000002';
const issued: string[] = [];

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    isConfigured: true,
    deleteAuthUser: async () => true,
    issueMagicLink: async (email: string) => {
      issued.push(email);
      return {
        userId: email.startsWith('family') ? FAMILY_ID : CAREGIVER_ID,
        tokenHash: `hash-for-${email}`,
      };
    },
  },
}));

const { createApp } = await import('@/app');
const { prisma } = await import('@/lib/prisma');

const app = createApp();

async function signedInAs(id: string, email: string) {
  return { Authorization: `Bearer ${await signAccessToken({ userId: id, email })}` };
}

beforeEach(async () => {
  await resetDatabase(prisma);
  await prisma.demoSeed.deleteMany();
  issued.length = 0;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('demo', () => {
  it('builds a believable demo and hands out a one-time sign-in', async () => {
    const session = await request(app).post('/v1/demo/session').send({ persona: 'family' });
    expect(session.status).toBe(201);
    expect(session.body.data).toEqual({
      email: 'family@demo.welcheq.example',
      tokenHash: 'hash-for-family@demo.welcheq.example',
    });

    const family = await signedInAs(FAMILY_ID, 'family@demo.welcheq.example');
    const patients = await request(app).get('/v1/patients').set(family);
    expect(
      patients.body.data.map((patient: { fullName: string }) => patient.fullName).sort(),
    ).toEqual(['Ngozi Okafor', 'Samuel Okafor']);
    const overview = await request(app).get('/v1/dashboard?days=7').set(family);
    expect(overview.body.data.totals.completed).toBeGreaterThan(5);
    expect(overview.body.data.totals.openIncidents).toBe(1);
  });

  it('only rebuilds once a day', async () => {
    await request(app).post('/v1/demo/session').send({ persona: 'family' }).expect(201);
    const firstPatients = await prisma.patient.findMany({ select: { id: true } });
    issued.length = 0;

    await request(app).post('/v1/demo/session').send({ persona: 'caregiver' }).expect(201);
    expect(issued).toEqual(['caregiver@demo.welcheq.example']);
    expect(await prisma.patient.findMany({ select: { id: true } })).toEqual(firstPatients);
  });

  it('lets demo visitors look but not change anything', async () => {
    await request(app).post('/v1/demo/session').send({ persona: 'family' }).expect(201);
    const family = await signedInAs(FAMILY_ID, 'family@demo.welcheq.example');
    const patient = await prisma.patient.findFirstOrThrow({ select: { id: true } });

    const message = await request(app)
      .post(`/v1/patients/${patient.id}/messages`)
      .set(family)
      .send({ body: 'Hello' });
    expect(message.status).toBe(403);
    expect(message.body.error.message).toContain('demo');
    expect((await request(app).delete('/v1/me').set(family)).status).toBe(403);
    await request(app).post('/v1/notifications/read').set(family).send({ all: true }).expect(204);
  });

  it('refuses unknown personas', async () => {
    expect((await request(app).post('/v1/demo/session').send({ persona: 'admin' })).status).toBe(
      400,
    );
  });
});
