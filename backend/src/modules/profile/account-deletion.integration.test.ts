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
  return { owner, caregiver, patientId };
}

beforeEach(async () => {
  await resetDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('account deletion', () => {
  it("deletes the owner's patients and clears their personal details", async () => {
    const { owner, patientId } = await setUp();
    await request(app).delete('/v1/me').set(owner.header).expect(204);

    expect(await prisma.patient.findUnique({ where: { id: patientId } })).toBeNull();
    const user = await prisma.user.findUniqueOrThrow({ where: { id: owner.userId } });
    expect(user).toMatchObject({ fullName: 'Deleted user', phone: null });
    expect(user.email).not.toContain('@example');
    expect(user.deletedAt).not.toBeNull();
  });

  it("keeps a caregiver's visits in the family's history without their name", async () => {
    const { owner, caregiver, patientId } = await setUp();
    await request(app)
      .post(`/v1/patients/${patientId}/visits/check-in`)
      .set(caregiver.header)
      .send({ location: AT_HOME, capturedAt: new Date().toISOString() })
      .expect(201);

    await request(app).delete('/v1/me').set(caregiver.header).expect(204);

    const visits = await prisma.visit.findMany({
      where: { patientId },
      select: { caregiver: { select: { fullName: true } } },
    });
    expect(visits).toEqual([{ caregiver: { fullName: 'Deleted user' } }]);
    const team = await request(app).get(`/v1/patients/${patientId}/members`).set(owner.header);
    expect(team.body.data.map((member: { fullName: string }) => member.fullName)).toEqual([
      'Adaeze Okafor',
    ]);
  });

  it('shuts the account out afterwards', async () => {
    const { owner } = await setUp();
    await request(app).delete('/v1/me').set(owner.header).expect(204);

    const profile = await request(app).get('/v1/me').set(owner.header);
    expect(profile.status).toBe(403);
    expect((await request(app).get('/v1/patients').set(owner.header)).status).toBe(403);
  });
});
