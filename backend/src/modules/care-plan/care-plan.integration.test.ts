import '@/test/mock-jwks';

import { addDays, localMoment } from '@welcheq/shared';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { signUpWithProfile, type SignedInUser } from '@/test/api-client';
import { resetDatabase } from '@/test/reset-database';

const { createApp } = await import('@/app');
const { prisma } = await import('@/lib/prisma');

const app = createApp();
const today = () => localMoment(new Date(), 'Africa/Lagos').date;

const newPatient = {
  fullName: 'Ngozi Okafor',
  homeAddress: '12 Ogui Road, Enugu',
  homeLocation: { latitude: 6.4413, longitude: 7.4988 },
};

const medicine = { title: 'Morning medicine', category: 'MEDICATION', time: '08:00' };

async function joinAs(owner: SignedInUser, patientId: string, role: 'CAREGIVER' | 'FAMILY') {
  const member = await signUpWithProfile(app, role);
  const relationship = role === 'CAREGIVER' ? 'CAREGIVER' : 'FAMILY_VIEWER';
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
  const owner = await signUpWithProfile(app, 'FAMILY');
  const patient = await request(app).post('/v1/patients').set(owner.header).send(newPatient);
  const patientId = patient.body.data.id as string;
  const task = await request(app)
    .post(`/v1/patients/${patientId}/care-tasks`)
    .set(owner.header)
    .send(medicine);
  return { owner, patientId, taskId: task.body.data.id as string };
}

beforeEach(async () => {
  await resetDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('care plan', () => {
  it('lets the owner add tasks', async () => {
    const { owner, patientId } = await setUp();
    const response = await request(app)
      .get(`/v1/patients/${patientId}/care-tasks`)
      .set(owner.header);
    expect(response.body.data).toEqual([
      expect.objectContaining({ title: medicine.title, time: '08:00', daysOfWeek: [] }),
    ]);
  });

  it('applies a template without duplicating existing tasks', async () => {
    const { owner, patientId } = await setUp();
    const first = await request(app)
      .post(`/v1/patients/${patientId}/care-tasks/from-template`)
      .set(owner.header)
      .send({ templateId: 'elderly-high-blood-pressure' });
    const second = await request(app)
      .post(`/v1/patients/${patientId}/care-tasks/from-template`)
      .set(owner.header)
      .send({ templateId: 'elderly-high-blood-pressure' });

    expect(first.status).toBe(200);
    expect(second.body.data).toHaveLength(first.body.data.length);
  });

  it('does not let caregivers change the plan', async () => {
    const { owner, patientId, taskId } = await setUp();
    const caregiver = await joinAs(owner, patientId, 'CAREGIVER');

    const add = await request(app)
      .post(`/v1/patients/${patientId}/care-tasks`)
      .set(caregiver.header)
      .send(medicine);
    const remove = await request(app)
      .delete(`/v1/patients/${patientId}/care-tasks/${taskId}`)
      .set(caregiver.header);

    expect(add.status).toBe(403);
    expect(remove.status).toBe(403);
  });

  it('hides removed tasks from the checklist', async () => {
    const { owner, patientId, taskId } = await setUp();
    await request(app)
      .delete(`/v1/patients/${patientId}/care-tasks/${taskId}`)
      .set(owner.header)
      .expect(204);

    const checklist = await request(app)
      .get(`/v1/patients/${patientId}/checklist`)
      .set(owner.header);
    expect(checklist.body.data.items).toEqual([]);
  });
});

describe('daily checklist', () => {
  it('lets a caregiver tick a task and shows who did it', async () => {
    const { owner, patientId, taskId } = await setUp();
    const caregiver = await joinAs(owner, patientId, 'CAREGIVER');

    const response = await request(app)
      .put(`/v1/patients/${patientId}/checklist/${taskId}`)
      .set(caregiver.header)
      .send({ date: today(), outcome: 'DONE', note: 'Taken with water' });

    expect(response.status).toBe(200);
    expect(response.body.data.items[0]).toMatchObject({
      status: 'DONE',
      record: { outcome: 'DONE', note: 'Taken with water', recordedBy: 'Test Person' },
    });
  });

  it('does not let family viewers tick tasks', async () => {
    const { owner, patientId, taskId } = await setUp();
    const viewer = await joinAs(owner, patientId, 'FAMILY');

    const checklist = await request(app)
      .get(`/v1/patients/${patientId}/checklist`)
      .set(viewer.header);
    const record = await request(app)
      .put(`/v1/patients/${patientId}/checklist/${taskId}`)
      .set(viewer.header)
      .send({ date: today(), outcome: 'DONE' });

    expect(checklist.body.data.canRecord).toBe(false);
    expect(record.status).toBe(403);
  });

  it('refuses records for the future or the distant past', async () => {
    const { owner, patientId, taskId } = await setUp();
    const future = await request(app)
      .put(`/v1/patients/${patientId}/checklist/${taskId}`)
      .set(owner.header)
      .send({ date: addDays(today(), 1), outcome: 'DONE' });
    const past = await request(app)
      .put(`/v1/patients/${patientId}/checklist/${taskId}`)
      .set(owner.header)
      .send({ date: addDays(today(), -5), outcome: 'DONE' });

    expect(future.status).toBe(400);
    expect(past.status).toBe(400);
  });

  it('marks unrecorded tasks on past days as missed', async () => {
    const { owner, patientId } = await setUp();
    const yesterday = await request(app)
      .get(`/v1/patients/${patientId}/checklist?date=${addDays(today(), -1)}`)
      .set(owner.header);
    expect(yesterday.body.data.items[0].status).toBe('MISSED');
  });

  it('keeps the previous answer in the audit log when a record is changed', async () => {
    const { owner, patientId, taskId } = await setUp();
    const record = (outcome: string) =>
      request(app)
        .put(`/v1/patients/${patientId}/checklist/${taskId}`)
        .set(owner.header)
        .send({ date: today(), outcome })
        .expect(200);

    await record('NOT_DONE');
    await record('DONE');

    const changes = await prisma.auditEvent.findMany({ where: { action: 'task_record.changed' } });
    expect(changes).toHaveLength(1);
    expect(changes[0]?.metadata).toMatchObject({ previous: { outcome: 'NOT_DONE' } });
  });

  it('never shows another family’s checklist', async () => {
    const { patientId } = await setUp();
    const stranger = await signUpWithProfile(app, 'FAMILY');
    const response = await request(app)
      .get(`/v1/patients/${patientId}/checklist`)
      .set(stranger.header);
    expect(response.status).toBe(404);
  });
});
