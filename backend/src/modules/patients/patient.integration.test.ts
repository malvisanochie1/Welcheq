import '@/test/mock-jwks';

import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { signIn, signUpWithProfile } from '@/test/api-client';
import { resetDatabase } from '@/test/reset-database';

const { createApp } = await import('@/app');
const { prisma } = await import('@/lib/prisma');

const app = createApp();

const newPatient = {
  fullName: 'Ngozi Okafor',
  dateOfBirth: '1948-03-14',
  homeAddress: '12 Ogui Road, Enugu',
  homeLocation: { latitude: 6.4413, longitude: 7.4988 },
};

async function registerPatient(header: { Authorization: string }) {
  const response = await request(app).post('/v1/patients').set(header).send(newPatient);
  expect(response.status).toBe(201);
  return response.body.data as { id: string };
}

beforeEach(async () => {
  await resetDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('registering a patient', () => {
  it('makes the family member the owner with location-only proof', async () => {
    const family = await signUpWithProfile(app, 'FAMILY');
    const response = await request(app).post('/v1/patients').set(family.header).send(newPatient);

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      fullName: newPatient.fullName,
      dateOfBirth: newPatient.dateOfBirth,
      relationship: 'OWNER',
      proofSettings: { methods: ['LOCATION'], geofenceRadiusMeters: 150 },
    });
  });

  it('records who registered the patient', async () => {
    const family = await signUpWithProfile(app, 'FAMILY');
    const patient = await registerPatient(family.header);

    const events = await prisma.auditEvent.findMany({ where: { entityId: patient.id } });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ actorId: family.userId, action: 'patient.created' });
  });

  it('does not let caregivers register patients', async () => {
    const caregiver = await signUpWithProfile(app, 'CAREGIVER');
    const response = await request(app).post('/v1/patients').set(caregiver.header).send(newPatient);
    expect(response.status).toBe(403);
  });

  it('requires a finished profile', async () => {
    const stranger = await signIn();
    const response = await request(app).post('/v1/patients').set(stranger.header).send(newPatient);
    expect(response.status).toBe(403);
  });

  it('refuses unknown fields', async () => {
    const family = await signUpWithProfile(app, 'FAMILY');
    const response = await request(app)
      .post('/v1/patients')
      .set(family.header)
      .send({ ...newPatient, organizationId: crypto.randomUUID() });
    expect(response.status).toBe(400);
  });
});

describe('patient privacy', () => {
  it('lists only the patients a user has access to', async () => {
    const first = await signUpWithProfile(app, 'FAMILY');
    const second = await signUpWithProfile(app, 'FAMILY');
    await registerPatient(first.header);

    const response = await request(app).get('/v1/patients').set(second.header);
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it('hides another family’s patient as not found', async () => {
    const owner = await signUpWithProfile(app, 'FAMILY');
    const stranger = await signUpWithProfile(app, 'FAMILY');
    const patient = await registerPatient(owner.header);

    const read = await request(app).get(`/v1/patients/${patient.id}`).set(stranger.header);
    const edit = await request(app)
      .patch(`/v1/patients/${patient.id}`)
      .set(stranger.header)
      .send({ fullName: 'Changed' });

    expect(read.status).toBe(404);
    expect(edit.status).toBe(404);
  });

  it('answers malformed ids without crashing', async () => {
    const family = await signUpWithProfile(app, 'FAMILY');
    const response = await request(app).get('/v1/patients/not-an-id').set(family.header);
    expect(response.status).toBe(400);
  });
});

describe('proof settings', () => {
  it('lets the owner add checks', async () => {
    const owner = await signUpWithProfile(app, 'FAMILY');
    const patient = await registerPatient(owner.header);

    const response = await request(app)
      .put(`/v1/patients/${patient.id}/proof-settings`)
      .set(owner.header)
      .send({ methods: ['LOCATION', 'SELFIE', 'SURPRISE_CHECK'], geofenceRadiusMeters: 100 });

    expect(response.status).toBe(200);
    expect(response.body.data.proofSettings).toEqual({
      methods: ['LOCATION', 'SELFIE', 'SURPRISE_CHECK'],
      geofenceRadiusMeters: 100,
    });
  });

  it('never allows the location check to be removed', async () => {
    const owner = await signUpWithProfile(app, 'FAMILY');
    const patient = await registerPatient(owner.header);

    const response = await request(app)
      .put(`/v1/patients/${patient.id}/proof-settings`)
      .set(owner.header)
      .send({ methods: ['SELFIE'], geofenceRadiusMeters: 100 });

    expect(response.status).toBe(400);
  });

  it('keeps an audit trail of every change', async () => {
    const owner = await signUpWithProfile(app, 'FAMILY');
    const patient = await registerPatient(owner.header);

    await request(app)
      .put(`/v1/patients/${patient.id}/proof-settings`)
      .set(owner.header)
      .send({ methods: ['LOCATION', 'SELFIE'], geofenceRadiusMeters: 150 })
      .expect(200);

    const actions = await prisma.auditEvent.findMany({
      where: { entityId: patient.id },
      orderBy: { createdAt: 'asc' },
      select: { action: true },
    });
    expect(actions.map(({ action }) => action)).toEqual([
      'patient.created',
      'patient.proof_settings_updated',
    ]);
  });
});
