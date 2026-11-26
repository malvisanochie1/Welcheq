import '@/test/mock-jwks';

import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { signUpWithProfile, type SignedInUser } from '@/test/api-client';
import { resetDatabase } from '@/test/reset-database';

const { createApp } = await import('@/app');
const { prisma } = await import('@/lib/prisma');

const app = createApp();

const newPatient = {
  fullName: 'Ngozi Okafor',
  homeAddress: '12 Ogui Road, Enugu',
  homeLocation: { latitude: 6.4413, longitude: 7.4988 },
};

async function setUpFamily() {
  const owner = await signUpWithProfile(app, 'FAMILY', 'Adaeze Okafor');
  const response = await request(app).post('/v1/patients').set(owner.header).send(newPatient);
  return { owner, patientId: response.body.data.id as string };
}

async function invite(owner: SignedInUser, patientId: string, relationship: string) {
  const response = await request(app)
    .post(`/v1/patients/${patientId}/invitations`)
    .set(owner.header)
    .send({ relationship });
  expect(response.status).toBe(201);
  return response.body.data as { id: string; code: string };
}

beforeEach(async () => {
  await resetDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('inviting a caregiver', () => {
  it('gives the caregiver access to the patient', async () => {
    const { owner, patientId } = await setUpFamily();
    const caregiver = await signUpWithProfile(app, 'CAREGIVER', 'Chika Eze');
    const { code } = await invite(owner, patientId, 'CAREGIVER');

    const accepted = await request(app)
      .post('/v1/invitations/accept')
      .set(caregiver.header)
      .send({ code: code.toLowerCase() });
    expect(accepted.status).toBe(200);
    expect(accepted.body.data).toMatchObject({ patientId, relationship: 'CAREGIVER' });

    const patients = await request(app).get('/v1/patients').set(caregiver.header);
    expect(patients.body.data).toHaveLength(1);
    expect(patients.body.data[0].relationship).toBe('CAREGIVER');
  });

  it('stores only a hash of the code', async () => {
    const { owner, patientId } = await setUpFamily();
    const { code } = await invite(owner, patientId, 'CAREGIVER');

    const stored = await prisma.invitation.findFirstOrThrow();
    expect(stored.codeHash).not.toContain(code.replace('-', ''));
  });

  it('works only once', async () => {
    const { owner, patientId } = await setUpFamily();
    const first = await signUpWithProfile(app, 'CAREGIVER');
    const second = await signUpWithProfile(app, 'CAREGIVER');
    const { code } = await invite(owner, patientId, 'CAREGIVER');

    await request(app).post('/v1/invitations/accept').set(first.header).send({ code }).expect(200);
    const reuse = await request(app)
      .post('/v1/invitations/accept')
      .set(second.header)
      .send({ code });
    expect(reuse.status).toBe(404);
  });

  it('refuses a code meant for another kind of account', async () => {
    const { owner, patientId } = await setUpFamily();
    const familyMember = await signUpWithProfile(app, 'FAMILY');
    const { code } = await invite(owner, patientId, 'CAREGIVER');

    const response = await request(app)
      .post('/v1/invitations/accept')
      .set(familyMember.header)
      .send({ code });
    expect(response.status).toBe(403);
  });

  it('refuses expired codes', async () => {
    const { owner, patientId } = await setUpFamily();
    const caregiver = await signUpWithProfile(app, 'CAREGIVER');
    const { id, code } = await invite(owner, patientId, 'CAREGIVER');
    await prisma.invitation.update({
      where: { id },
      data: { expiresAt: new Date(Date.now() - 1) },
    });

    const response = await request(app)
      .post('/v1/invitations/accept')
      .set(caregiver.header)
      .send({ code });
    expect(response.status).toBe(404);
  });

  it('refuses revoked codes', async () => {
    const { owner, patientId } = await setUpFamily();
    const caregiver = await signUpWithProfile(app, 'CAREGIVER');
    const { id, code } = await invite(owner, patientId, 'CAREGIVER');

    await request(app)
      .delete(`/v1/patients/${patientId}/invitations/${id}`)
      .set(owner.header)
      .expect(204);
    const response = await request(app)
      .post('/v1/invitations/accept')
      .set(caregiver.header)
      .send({ code });
    expect(response.status).toBe(404);
  });

  it('answers made-up codes with the same message as expired ones', async () => {
    const caregiver = await signUpWithProfile(app, 'CAREGIVER');
    const response = await request(app)
      .post('/v1/invitations/accept')
      .set(caregiver.header)
      .send({ code: 'WQ7K-3M9P' });
    expect(response.status).toBe(404);
    expect(response.body.error.message).toMatch(/not valid or has expired/);
  });

  it('only lets the owner create invitations', async () => {
    const { owner, patientId } = await setUpFamily();
    const caregiver = await signUpWithProfile(app, 'CAREGIVER');
    const { code } = await invite(owner, patientId, 'CAREGIVER');
    await request(app)
      .post('/v1/invitations/accept')
      .set(caregiver.header)
      .send({ code })
      .expect(200);

    const response = await request(app)
      .post(`/v1/patients/${patientId}/invitations`)
      .set(caregiver.header)
      .send({ relationship: 'CAREGIVER' });
    expect(response.status).toBe(403);
  });

  it('never lets anyone be invited as an owner', async () => {
    const { owner, patientId } = await setUpFamily();
    const response = await request(app)
      .post(`/v1/patients/${patientId}/invitations`)
      .set(owner.header)
      .send({ relationship: 'OWNER' });
    expect(response.status).toBe(400);
  });
});

describe('care team', () => {
  it('lists the team and hides phone numbers from caregivers', async () => {
    const { owner, patientId } = await setUpFamily();
    const caregiver = await signUpWithProfile(app, 'CAREGIVER', 'Chika Eze');
    const { code } = await invite(owner, patientId, 'CAREGIVER');
    await request(app)
      .post('/v1/invitations/accept')
      .set(caregiver.header)
      .send({ code })
      .expect(200);

    const asCaregiver = await request(app)
      .get(`/v1/patients/${patientId}/members`)
      .set(caregiver.header);
    expect(asCaregiver.status).toBe(200);
    expect(asCaregiver.body.data).toHaveLength(2);
    expect(asCaregiver.body.data.every((member: { phone: unknown }) => member.phone === null)).toBe(
      true,
    );
  });

  it('removes a caregiver’s access immediately', async () => {
    const { owner, patientId } = await setUpFamily();
    const caregiver = await signUpWithProfile(app, 'CAREGIVER');
    const { code } = await invite(owner, patientId, 'CAREGIVER');
    await request(app)
      .post('/v1/invitations/accept')
      .set(caregiver.header)
      .send({ code })
      .expect(200);

    await request(app)
      .delete(`/v1/patients/${patientId}/members/${caregiver.userId}`)
      .set(owner.header)
      .expect(204);

    const read = await request(app).get(`/v1/patients/${patientId}`).set(caregiver.header);
    expect(read.status).toBe(404);
  });

  it('never removes the owner', async () => {
    const { owner, patientId } = await setUpFamily();
    const response = await request(app)
      .delete(`/v1/patients/${patientId}/members/${owner.userId}`)
      .set(owner.header);
    expect(response.status).toBe(404);
  });
});
