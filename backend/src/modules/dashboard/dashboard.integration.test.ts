import '@/test/mock-jwks';

import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { signUpWithProfile } from '@/test/api-client';
import { resetDatabase } from '@/test/reset-database';

const { createApp } = await import('@/app');
const { prisma } = await import('@/lib/prisma');

const app = createApp();
const HOUR_MS = 3_600_000;
const HOME = { latitude: 6.4413, longitude: 7.4988 };
const AT_HOME = { latitude: HOME.latitude + 0.0005, longitude: HOME.longitude, accuracyMeters: 15 };

beforeEach(async () => {
  await resetDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('dashboard', () => {
  it('sums visits, missed visits and incidents across owned patients', async () => {
    const owner = await signUpWithProfile(app, 'AGENCY_ADMIN', 'Bisi Adeyemi');
    const patient = await request(app)
      .post('/v1/patients')
      .set(owner.header)
      .send({ fullName: 'Ngozi Okafor', homeAddress: '12 Ogui Road, Enugu', homeLocation: HOME });
    const patientId = patient.body.data.id as string;
    const caregiver = await signUpWithProfile(app, 'CAREGIVER', 'Chika Eze');
    const invitation = await request(app)
      .post(`/v1/patients/${patientId}/invitations`)
      .set(owner.header)
      .send({ relationship: 'CAREGIVER' });
    await request(app)
      .post('/v1/invitations/accept')
      .set(caregiver.header)
      .send({ code: invitation.body.data.code })
      .expect(200);

    await prisma.shift.create({
      data: {
        patientId,
        caregiverId: caregiver.userId,
        createdById: owner.userId,
        startsAt: new Date(Date.now() - 30 * HOUR_MS),
        endsAt: new Date(Date.now() - 26 * HOUR_MS),
      },
    });
    const visit = await request(app)
      .post(`/v1/patients/${patientId}/visits/check-in`)
      .set(caregiver.header)
      .send({ location: AT_HOME, capturedAt: new Date().toISOString() });
    await request(app)
      .post(`/v1/patients/${patientId}/visits/${visit.body.data.id}/check-out`)
      .set(caregiver.header)
      .send({ location: AT_HOME, capturedAt: new Date().toISOString() });
    await request(app).post(`/v1/patients/${patientId}/incidents`).set(caregiver.header).send({
      category: 'FALL',
      severity: 'LOW',
      description: 'Tripped on the rug, no injury at all.',
      occurredAt: new Date().toISOString(),
    });

    const overview = await request(app).get('/v1/dashboard?days=7').set(owner.header);
    expect(overview.body.data.totals).toMatchObject({
      scheduled: 1,
      completed: 1,
      missed: 1,
      openIncidents: 1,
    });
    expect(overview.body.data.caregivers[0]).toMatchObject({ fullName: 'Chika Eze', completed: 1 });
  });

  it('only accepts the offered periods', async () => {
    const owner = await signUpWithProfile(app, 'FAMILY');
    expect((await request(app).get('/v1/dashboard?days=5').set(owner.header)).status).toBe(400);
  });
});
