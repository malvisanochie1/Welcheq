import '@/test/mock-jwks';

import { homeCodeAt } from '@welcheq/shared';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { signUpWithProfile, type SignedInUser } from '@/test/api-client';
import { resetDatabase } from '@/test/reset-database';

const { createApp } = await import('@/app');
const { prisma } = await import('@/lib/prisma');

const app = createApp();

const HOME = { latitude: 6.4413, longitude: 7.4988 };
const AT_HOME = { latitude: HOME.latitude + 0.0005, longitude: HOME.longitude, accuracyMeters: 15 };
const ACROSS_TOWN = {
  latitude: HOME.latitude + 0.01,
  longitude: HOME.longitude,
  accuracyMeters: 15,
};

async function setUp(methods: string[]) {
  const owner = await signUpWithProfile(app, 'FAMILY');
  const patient = await request(app)
    .post('/v1/patients')
    .set(owner.header)
    .send({ fullName: 'Ngozi Okafor', homeAddress: '12 Ogui Road, Enugu', homeLocation: HOME });
  const patientId = patient.body.data.id as string;
  await request(app)
    .put(`/v1/patients/${patientId}/proof-settings`)
    .set(owner.header)
    .send({ methods: ['LOCATION', ...methods], geofenceRadiusMeters: 150 })
    .expect(200);

  const caregiver = await signUpWithProfile(app, 'CAREGIVER');
  const invitation = await request(app)
    .post(`/v1/patients/${patientId}/invitations`)
    .set(owner.header)
    .send({ relationship: 'CAREGIVER' });
  await request(app)
    .post('/v1/invitations/accept')
    .set(caregiver.header)
    .send({ code: invitation.body.data.code })
    .expect(200);

  return { owner, caregiver, patientId };
}

async function pairDisplay(owner: SignedInUser, patientId: string) {
  const pairing = await request(app)
    .post(`/v1/patients/${patientId}/home-display/pairing`)
    .set(owner.header)
    .expect(201);
  const paired = await request(app)
    .post('/v1/home-display/pair')
    .send({ code: pairing.body.data.code })
    .expect(200);
  return {
    pairingCode: pairing.body.data.code as string,
    secret: paired.body.data.secret as string,
  };
}

const checkIn = (caregiver: SignedInUser, patientId: string, extra: Record<string, unknown> = {}) =>
  request(app)
    .post(`/v1/patients/${patientId}/visits/check-in`)
    .set(caregiver.header)
    .send({ location: AT_HOME, capturedAt: new Date().toISOString(), ...extra });

beforeEach(async () => {
  await resetDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('home display', () => {
  it('pairs once without an account and is never cached', async () => {
    const { owner, patientId } = await setUp([]);
    const pairing = await request(app)
      .post(`/v1/patients/${patientId}/home-display/pairing`)
      .set(owner.header);

    const first = await request(app)
      .post('/v1/home-display/pair')
      .send({ code: pairing.body.data.code });
    const again = await request(app)
      .post('/v1/home-display/pair')
      .send({ code: pairing.body.data.code });

    expect(first.status).toBe(200);
    expect(first.headers['cache-control']).toBe('no-store');
    expect(first.body.data).toMatchObject({
      patientFirstName: 'Ngozi',
      digits: 6,
      periodSeconds: 60,
    });
    expect(again.status).toBe(404);
  });

  it('can only be set up by the family member who manages care', async () => {
    const { caregiver, patientId } = await setUp([]);
    const response = await request(app)
      .post(`/v1/patients/${patientId}/home-display/pairing`)
      .set(caregiver.header);
    expect(response.status).toBe(403);
  });

  it('never exposes the secret through the patient record', async () => {
    const { owner, patientId } = await setUp([]);
    await pairDisplay(owner, patientId);
    const patient = await request(app).get(`/v1/patients/${patientId}`).set(owner.header);
    expect(patient.body.data.isHomeDisplayConfigured).toBe(true);
    expect(JSON.stringify(patient.body)).not.toMatch(/secret/i);
  });
});

describe('home code at check-in', () => {
  it('requires the code shown on the display', async () => {
    const { owner, caregiver, patientId } = await setUp(['ROTATING_CODE']);
    const { secret } = await pairDisplay(owner, patientId);

    const missing = await checkIn(caregiver, patientId);
    const wrong = await checkIn(caregiver, patientId, {
      homeCode: '000000' === homeCodeAt(secret, new Date()) ? '111111' : '000000',
    });
    const right = await checkIn(caregiver, patientId, { homeCode: homeCodeAt(secret, new Date()) });

    expect(missing.status).toBe(400);
    expect(wrong.status).toBe(400);
    expect(right.status).toBe(201);
    expect(right.body.data.homeCodeVerified).toBe(true);
  });

  it('stops old displays working after a reset', async () => {
    const { owner, caregiver, patientId } = await setUp(['ROTATING_CODE']);
    const { secret } = await pairDisplay(owner, patientId);
    await request(app)
      .post(`/v1/patients/${patientId}/home-display/reset`)
      .set(owner.header)
      .expect(204);

    const response = await checkIn(caregiver, patientId, {
      homeCode: homeCodeAt(secret, new Date()),
    });
    expect(response.status).toBe(400);
  });
});

describe('surprise check', () => {
  async function openVisitWithDueCheck() {
    const context = await setUp(['SURPRISE_CHECK']);
    const visit = await checkIn(context.caregiver, context.patientId).expect(201);
    await prisma.surpriseCheck.updateMany({ data: { dueAt: new Date(Date.now() - 60_000) } });
    return { ...context, visitId: visit.body.data.id as string };
  }

  it('stays hidden until it is due', async () => {
    const { caregiver, patientId } = await setUp(['SURPRISE_CHECK']);
    const visit = await checkIn(caregiver, patientId).expect(201);
    expect(visit.body.data.surpriseCheck).toEqual({
      id: null,
      status: 'WAITING',
      dueAt: null,
      respondedAt: null,
    });
  });

  it('passes when answered at the home', async () => {
    const { caregiver, patientId, visitId } = await openVisitWithDueCheck();

    const open = await request(app).get('/v1/me/visits/open').set(caregiver.header);
    expect(open.body.data.surpriseCheck.status).toBe('DUE');

    const answer = await request(app)
      .post(`/v1/patients/${patientId}/visits/${visitId}/surprise-check`)
      .set(caregiver.header)
      .send({ location: AT_HOME, capturedAt: new Date().toISOString() });
    expect(answer.body.data).toEqual({ passed: true });

    const twice = await request(app)
      .post(`/v1/patients/${patientId}/visits/${visitId}/surprise-check`)
      .set(caregiver.header)
      .send({ location: AT_HOME, capturedAt: new Date().toISOString() });
    expect(twice.status).toBe(409);
  });

  it('fails when answered away from the home, and the family sees it', async () => {
    const { owner, caregiver, patientId, visitId } = await openVisitWithDueCheck();

    await request(app)
      .post(`/v1/patients/${patientId}/visits/${visitId}/surprise-check`)
      .set(caregiver.header)
      .send({ location: ACROSS_TOWN, capturedAt: new Date().toISOString() })
      .expect(200);

    const today = new Date().toISOString().slice(0, 10);
    const visits = await request(app)
      .get(`/v1/patients/${patientId}/visits?from=${today}&to=${today}`)
      .set(owner.header);
    expect(visits.body.data[0].surpriseCheck.status).toBe('FAILED');
  });
});
