import '@/test/mock-jwks';

import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { signUpWithProfile } from '@/test/api-client';
import { resetDatabase } from '@/test/reset-database';

const { createApp } = await import('@/app');
const { prisma } = await import('@/lib/prisma');

const app = createApp();

async function setUp() {
  const owner = await signUpWithProfile(app, 'FAMILY', 'Adaeze Okafor');
  const patient = await request(app)
    .post('/v1/patients')
    .set(owner.header)
    .send({
      fullName: 'Ngozi Okafor',
      homeAddress: '12 Ogui Road, Enugu',
      homeLocation: { latitude: 6.4413, longitude: 7.4988 },
    });
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
  return { owner, caregiver, url: `/v1/patients/${patientId}/messages` };
}

beforeEach(async () => {
  await resetDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('care team messages', () => {
  it('shares messages with the care team in the order they were sent', async () => {
    const { owner, caregiver, url } = await setUp();
    await request(app).post(url).set(owner.header).send({ body: 'Please check her feet today.' });
    await request(app).post(url).set(caregiver.header).send({ body: 'Will do, she is resting.' });

    const thread = await request(app).get(url).set(caregiver.header);
    expect(thread.body.data.map((message: { body: string }) => message.body)).toEqual([
      'Please check her feet today.',
      'Will do, she is resting.',
    ]);
    expect(thread.body.data[0].author.fullName).toBe('Adaeze Okafor');
  });

  it('notifies the rest of the care team', async () => {
    const { owner, caregiver, url } = await setUp();
    await request(app).post(url).set(owner.header).send({ body: 'Running late today.' });

    const inbox = await request(app).get('/v1/notifications').set(caregiver.header);
    expect(inbox.body.data.notifications[0]).toMatchObject({
      kind: 'MESSAGE',
      title: 'Message from Adaeze',
      body: 'Running late today.',
    });
  });

  it('refuses empty messages and strangers', async () => {
    const { owner, url } = await setUp();
    expect((await request(app).post(url).set(owner.header).send({ body: '   ' })).status).toBe(400);
    const stranger = await signUpWithProfile(app, 'FAMILY');
    expect((await request(app).get(url).set(stranger.header)).status).toBe(404);
  });
});
