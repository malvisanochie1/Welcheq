import '@/test/mock-jwks';

import { localMoment } from '@welcheq/shared';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { signUpWithProfile, type SignedInUser } from '@/test/api-client';
import { resetDatabase } from '@/test/reset-database';

const { createApp } = await import('@/app');
const { prisma } = await import('@/lib/prisma');

const app = createApp();
const HOME = { latitude: 6.4413, longitude: 7.4988 };
const today = () => localMoment(new Date(), 'Africa/Lagos').date;

async function join(owner: SignedInUser, patientId: string, role: 'CAREGIVER' | 'FAMILY') {
  const member = await signUpWithProfile(app, role);
  const invitation = await request(app)
    .post(`/v1/patients/${patientId}/invitations`)
    .set(owner.header)
    .send({ relationship: role === 'CAREGIVER' ? 'CAREGIVER' : 'FAMILY_VIEWER' });
  await request(app)
    .post('/v1/invitations/accept')
    .set(member.header)
    .send({ code: invitation.body.data.code })
    .expect(200);
  return member;
}

async function setUp() {
  const owner = await signUpWithProfile(app, 'FAMILY');
  const patient = await request(app)
    .post('/v1/patients')
    .set(owner.header)
    .send({ fullName: 'Ngozi Okafor', homeAddress: '12 Ogui Road, Enugu', homeLocation: HOME });
  const patientId = patient.body.data.id as string;
  const task = await request(app)
    .post(`/v1/patients/${patientId}/care-tasks`)
    .set(owner.header)
    .send({ title: 'Morning medicine', category: 'MEDICATION', time: '00:00' });
  return { owner, patientId, taskId: task.body.data.id as string };
}

const recordCall = (caller: SignedInUser, patientId: string, body: Record<string, unknown>) =>
  request(app)
    .post(`/v1/patients/${patientId}/daily-call`)
    .set(caller.header)
    .send({ date: today(), ...body });

beforeEach(async () => {
  await resetDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('daily call', () => {
  it('asks about tasks already due today and whether the caregiver came', async () => {
    const { owner, patientId } = await setUp();
    await request(app)
      .post(`/v1/patients/${patientId}/care-tasks`)
      .set(owner.header)
      .send({ title: 'Late dinner', category: 'MEAL', time: '23:59' });

    const call = await request(app).get(`/v1/patients/${patientId}/daily-call`).set(owner.header);

    expect(call.status).toBe(200);
    expect(call.body.data.questions.map((question: { title: string }) => question.title)).toEqual([
      'Morning medicine',
      'The caregiver came today',
    ]);
  });

  it('flags a task the caregiver ticked but the patient says did not happen', async () => {
    const { owner, patientId, taskId } = await setUp();
    const caregiver = await join(owner, patientId, 'CAREGIVER');
    await request(app)
      .put(`/v1/patients/${patientId}/checklist/${taskId}`)
      .set(caregiver.header)
      .send({ date: today(), outcome: 'DONE' })
      .expect(200);

    const response = await recordCall(owner, patientId, {
      outcome: 'REACHED',
      answers: [
        { kind: 'TASK', taskId, answer: 'NO' },
        { kind: 'CAREGIVER_VISITED', taskId: null, answer: 'NOT_SURE' },
      ],
    });

    expect(response.status).toBe(201);
    expect(response.body.data.mismatchCount).toBe(1);
    expect(response.body.data.answers[0]).toMatchObject({
      title: 'Morning medicine',
      isMismatch: true,
    });
  });

  it('flags a visit the patient says did not happen only when one was recorded', async () => {
    const { owner, patientId } = await setUp();
    const response = await recordCall(owner, patientId, {
      outcome: 'REACHED',
      answers: [{ kind: 'CAREGIVER_VISITED', taskId: null, answer: 'NO' }],
    });
    expect(response.body.data.mismatchCount).toBe(0);
  });

  it('records calls that did not get through without answers', async () => {
    const { owner, patientId, taskId } = await setUp();
    const ok = await recordCall(owner, patientId, { outcome: 'UNREACHABLE' });
    const withAnswers = await recordCall(owner, patientId, {
      outcome: 'UNREACHABLE',
      answers: [{ kind: 'TASK', taskId, answer: 'YES' }],
    });
    expect(ok.status).toBe(201);
    expect(withAnswers.status).toBe(400);
  });

  it('lets family viewers call but not caregivers', async () => {
    const { owner, patientId } = await setUp();
    const viewer = await join(owner, patientId, 'FAMILY');
    const caregiver = await join(owner, patientId, 'CAREGIVER');

    const asViewer = await recordCall(viewer, patientId, { outcome: 'UNREACHABLE' });
    const asCaregiver = await request(app)
      .get(`/v1/patients/${patientId}/daily-call`)
      .set(caregiver.header);

    expect(asViewer.status).toBe(201);
    expect(asCaregiver.status).toBe(403);
  });

  it('refuses questions from another patient’s plan', async () => {
    const { owner, patientId } = await setUp();
    const other = await setUp();
    const response = await recordCall(owner, patientId, {
      outcome: 'REACHED',
      answers: [{ kind: 'TASK', taskId: other.taskId, answer: 'YES' }],
    });
    expect(response.status).toBe(400);
  });

  it('keeps the patient’s phone number for the call button', async () => {
    const { owner, patientId } = await setUp();
    await request(app)
      .put(`/v1/patients/${patientId}/contact`)
      .set(owner.header)
      .send({ phone: '+234 803 555 0101' })
      .expect(204);

    const call = await request(app).get(`/v1/patients/${patientId}/daily-call`).set(owner.header);
    expect(call.body.data.phone).toBe('+234 803 555 0101');
  });
});
