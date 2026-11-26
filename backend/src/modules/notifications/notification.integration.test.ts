import '@/test/mock-jwks';

import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { signUpWithProfile, type SignedInUser } from '@/test/api-client';
import { resetDatabase } from '@/test/reset-database';

const { createApp } = await import('@/app');
const { prisma } = await import('@/lib/prisma');

const app = createApp();
const HOUR_MS = 3_600_000;
const HOME = { latitude: 6.4413, longitude: 7.4988 };
const AT_HOME = { latitude: HOME.latitude + 0.0005, longitude: HOME.longitude, accuracyMeters: 15 };

async function join(owner: SignedInUser, patientId: string, relationship: string, name: string) {
  const member = await signUpWithProfile(
    app,
    relationship === 'CAREGIVER' ? 'CAREGIVER' : 'FAMILY',
    name,
  );
  const invitation = await request(app)
    .post(`/v1/patients/${patientId}/invitations`)
    .set(owner.header)
    .send({ relationship });
  await request(app)
    .post('/v1/invitations/accept')
    .set(member.header)
    .send({ code: invitation.body.data.code })
    .expect(200);
  return member;
}

async function setUp() {
  const owner = await signUpWithProfile(app, 'FAMILY', 'Adaeze Okafor');
  const patient = await request(app)
    .post('/v1/patients')
    .set(owner.header)
    .send({ fullName: 'Ngozi Okafor', homeAddress: '12 Ogui Road, Enugu', homeLocation: HOME });
  const patientId = patient.body.data.id as string;
  const caregiver = await join(owner, patientId, 'CAREGIVER', 'Chika Eze');
  const sibling = await join(owner, patientId, 'FAMILY_VIEWER', 'Emeka Okafor');
  return { owner, caregiver, sibling, patientId };
}

const inbox = async (user: SignedInUser) =>
  (await request(app).get('/v1/notifications').set(user.header)).body.data;

beforeEach(async () => {
  await resetDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('notifications', () => {
  it('tells the family when the caregiver arrives and leaves, but not the caregiver', async () => {
    const { owner, caregiver, sibling, patientId } = await setUp();
    const visit = await request(app)
      .post(`/v1/patients/${patientId}/visits/check-in`)
      .set(caregiver.header)
      .send({ location: AT_HOME, capturedAt: new Date().toISOString() })
      .expect(201);
    await request(app)
      .post(`/v1/patients/${patientId}/visits/${visit.body.data.id}/check-out`)
      .set(caregiver.header)
      .send({ location: AT_HOME, capturedAt: new Date().toISOString() })
      .expect(200);

    const ownerInbox = await inbox(owner);
    expect(ownerInbox.unreadCount).toBe(2);
    expect(ownerInbox.notifications.map((n: { title: string }) => n.title)).toEqual([
      'Chika left',
      'Chika arrived',
    ]);
    expect((await inbox(sibling)).unreadCount).toBe(2);
    expect((await inbox(caregiver)).unreadCount).toBe(0);
  });

  it('tells everyone except the reporter about an incident', async () => {
    const { owner, caregiver, patientId } = await setUp();
    await request(app)
      .post(`/v1/patients/${patientId}/incidents`)
      .set(caregiver.header)
      .send({
        category: 'FALL',
        severity: 'HIGH',
        description: 'Slipped in the bathroom, bruised her arm.',
        occurredAt: new Date().toISOString(),
      })
      .expect(201);

    const ownerInbox = await inbox(owner);
    expect(ownerInbox.notifications[0]).toMatchObject({
      kind: 'INCIDENT_REPORTED',
      title: 'Incident: Fall',
    });
    expect((await inbox(caregiver)).unreadCount).toBe(0);
  });

  it('announces a missed visit to the family once', async () => {
    const { owner, caregiver, patientId } = await setUp();
    await prisma.shift.create({
      data: {
        patientId,
        caregiverId: caregiver.userId,
        createdById: owner.userId,
        startsAt: new Date(Date.now() - 2 * HOUR_MS),
        endsAt: new Date(Date.now() + 2 * HOUR_MS),
      },
    });

    await inbox(owner);
    const second = await inbox(owner);
    const missed = second.notifications.filter((n: { kind: string }) => n.kind === 'VISIT_MISSED');
    expect(missed).toHaveLength(1);
    expect(missed[0].title).toBe('Chika has not arrived');
  });

  it('marks notifications as read', async () => {
    const { owner, caregiver, patientId } = await setUp();
    await request(app)
      .post(`/v1/patients/${patientId}/visits/check-in`)
      .set(caregiver.header)
      .send({ location: AT_HOME, capturedAt: new Date().toISOString() });

    await request(app)
      .post('/v1/notifications/read')
      .set(owner.header)
      .send({ all: true })
      .expect(204);
    const count = await request(app).get('/v1/notifications/unread-count').set(owner.header);
    expect(count.body.data.unreadCount).toBe(0);
  });
});
