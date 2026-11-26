import '@/test/mock-jwks';

import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { signUpWithProfile } from '@/test/api-client';
import { resetDatabase } from '@/test/reset-database';

const { createApp } = await import('@/app');
const { prisma } = await import('@/lib/prisma');

const app = createApp();
const HOME = { latitude: 6.4413, longitude: 7.4988 };
const AT_HOME = { latitude: HOME.latitude + 0.0005, longitude: HOME.longitude, accuracyMeters: 15 };

async function setUp() {
  const owner = await signUpWithProfile(app, 'FAMILY', 'Adaeze Okafor');
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
  const url = `/v1/patients/${patientId}/caregivers/${caregiver.userId}`;
  return { owner, caregiver, patientId, url };
}

async function completeVisit(header: { Authorization: string }, patientId: string) {
  const visit = await request(app)
    .post(`/v1/patients/${patientId}/visits/check-in`)
    .set(header)
    .send({ location: AT_HOME, capturedAt: new Date().toISOString() })
    .expect(201);
  await request(app)
    .post(`/v1/patients/${patientId}/visits/${visit.body.data.id}/check-out`)
    .set(header)
    .send({ location: AT_HOME, capturedAt: new Date().toISOString() })
    .expect(200);
}

beforeEach(async () => {
  await resetDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('caregiver reviews', () => {
  it('waits for a completed visit before the family can review', async () => {
    const { owner, url } = await setUp();
    const profile = await request(app).get(url).set(owner.header);
    expect(profile.body.data.canReview).toBe(false);

    const early = await request(app).put(`${url}/review`).set(owner.header).send({ rating: 5 });
    expect(early.status).toBe(409);
  });

  it('records one review per family member and shows the average', async () => {
    const { owner, caregiver, patientId, url } = await setUp();
    await completeVisit(caregiver.header, patientId);

    await request(app).put(`${url}/review`).set(owner.header).send({ rating: 3 }).expect(204);
    await request(app)
      .put(`${url}/review`)
      .set(owner.header)
      .send({ rating: 5, comment: 'Always on time and very gentle with mum.' })
      .expect(204);

    const profile = await request(app).get(url).set(owner.header);
    expect(profile.body.data.rating).toEqual({ average: 5, count: 1 });
    expect(profile.body.data.reviews[0]).toMatchObject({ reviewer: 'Adaeze', rating: 5 });
    expect(profile.body.data.trackRecord).toMatchObject({ visits: 1, late: 0, missed: 0 });
  });

  it('does not let caregivers review each other', async () => {
    const { caregiver, patientId, url } = await setUp();
    await completeVisit(caregiver.header, patientId);
    const response = await request(app)
      .put(`${url}/review`)
      .set(caregiver.header)
      .send({ rating: 5 });
    expect(response.status).toBe(403);
  });

  it('refuses ratings outside one to five', async () => {
    const { owner, url } = await setUp();
    const response = await request(app).put(`${url}/review`).set(owner.header).send({ rating: 6 });
    expect(response.status).toBe(400);
  });
});
