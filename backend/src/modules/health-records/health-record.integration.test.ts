import '@/test/mock-jwks';

import { localMoment } from '@welcheq/shared';
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
const today = () => localMoment(new Date(), 'Africa/Lagos').date;

async function join(owner: SignedInUser, patientId: string, role: 'CAREGIVER' | 'FAMILY') {
  const member = await signUpWithProfile(
    app,
    role,
    role === 'CAREGIVER' ? 'Chika Eze' : 'Emeka Okafor',
  );
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

async function setUpVisit() {
  const owner = await signUpWithProfile(app, 'FAMILY', 'Adaeze Okafor');
  const patient = await request(app)
    .post('/v1/patients')
    .set(owner.header)
    .send({ fullName: 'Ngozi Okafor', homeAddress: '12 Ogui Road, Enugu', homeLocation: HOME });
  const patientId = patient.body.data.id as string;
  const caregiver = await join(owner, patientId, 'CAREGIVER');
  const visit = await request(app)
    .post(`/v1/patients/${patientId}/visits/check-in`)
    .set(caregiver.header)
    .send({ location: AT_HOME, capturedAt: new Date().toISOString() })
    .expect(201);
  return { owner, caregiver, patientId, visitId: visit.body.data.id as string };
}

const report = {
  wellbeing: 'OKAY',
  notes: 'Ate well, a little tired after lunch.',
  readings: [
    { type: 'BLOOD_PRESSURE', value: 138, secondaryValue: 86 },
    { type: 'TEMPERATURE', value: 36.8 },
  ],
};

beforeEach(async () => {
  await resetDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('visit report', () => {
  it('saves how the patient was, with readings labelled as from the caregiver', async () => {
    const { owner, caregiver, patientId, visitId } = await setUpVisit();
    const saved = await request(app)
      .put(`/v1/patients/${patientId}/visits/${visitId}/report`)
      .set(caregiver.header)
      .send(report);

    expect(saved.status).toBe(200);

    const asFamily = await request(app)
      .get(`/v1/patients/${patientId}/visits/${visitId}/report`)
      .set(owner.header);
    expect(asFamily.body.data.report).toMatchObject({ wellbeing: 'OKAY', author: 'Chika Eze' });
    expect(asFamily.body.data.readings).toHaveLength(2);
    expect(asFamily.body.data.readings[0]).toMatchObject({
      source: 'CAREGIVER',
      unit: 'mmHg',
      recordedBy: 'Chika Eze',
    });
  });

  it('keeps the earlier version when a report is changed', async () => {
    const { caregiver, patientId, visitId } = await setUpVisit();
    const url = `/v1/patients/${patientId}/visits/${visitId}/report`;
    await request(app).put(url).set(caregiver.header).send({ wellbeing: 'GOOD' }).expect(200);
    await request(app).put(url).set(caregiver.header).send({ wellbeing: 'UNWELL' }).expect(200);

    const changes = await prisma.auditEvent.findMany({ where: { action: 'visit_report.changed' } });
    expect(changes[0]?.metadata).toMatchObject({ previous: { wellbeing: 'GOOD' } });
  });

  it('can only be written by the caregiver on that visit', async () => {
    const { owner, patientId, visitId } = await setUpVisit();
    const other = await join(owner, patientId, 'CAREGIVER');
    const response = await request(app)
      .put(`/v1/patients/${patientId}/visits/${visitId}/report`)
      .set(other.header)
      .send(report);
    expect(response.status).toBe(404);
  });

  it('closes for editing 12 hours after check-out', async () => {
    const { caregiver, patientId, visitId } = await setUpVisit();
    await prisma.visit.update({
      where: { id: visitId },
      data: { checkOutAt: new Date(Date.now() - 13 * HOUR_MS), openForCaregiverId: null },
    });
    const response = await request(app)
      .put(`/v1/patients/${patientId}/visits/${visitId}/report`)
      .set(caregiver.header)
      .send(report);
    expect(response.status).toBe(409);
  });

  it('refuses readings dated in the future', async () => {
    const { caregiver, patientId, visitId } = await setUpVisit();
    const response = await request(app)
      .put(`/v1/patients/${patientId}/visits/${visitId}/report`)
      .set(caregiver.header)
      .send({
        wellbeing: 'GOOD',
        readings: [
          {
            type: 'HEART_RATE',
            value: 72,
            measuredAt: new Date(Date.now() + 2 * HOUR_MS).toISOString(),
          },
        ],
      });
    expect(response.status).toBe(400);
  });
});

describe('readings', () => {
  it('lets family add readings, labelled as from the family', async () => {
    const { owner, patientId } = await setUpVisit();
    await request(app)
      .post(`/v1/patients/${patientId}/readings`)
      .set(owner.header)
      .send({ type: 'WEIGHT', value: 64.5 })
      .expect(201);

    const list = await request(app)
      .get(`/v1/patients/${patientId}/readings?type=WEIGHT&from=${today()}&to=${today()}`)
      .set(owner.header);
    expect(list.body.data).toEqual([
      expect.objectContaining({ value: 64.5, unit: 'kg', source: 'FAMILY' }),
    ]);
  });

  it('never shows another family’s readings', async () => {
    const { patientId } = await setUpVisit();
    const stranger = await signUpWithProfile(app, 'FAMILY');
    const response = await request(app)
      .get(`/v1/patients/${patientId}/readings?from=${today()}&to=${today()}`)
      .set(stranger.header);
    expect(response.status).toBe(404);
  });
});

describe('incidents', () => {
  const fall = {
    category: 'FALL',
    severity: 'HIGH',
    description: 'Slipped in the bathroom, bruised her left arm.',
    occurredAt: new Date().toISOString(),
  };

  it('lets any care team member report and the owner resolve', async () => {
    const { owner, caregiver, patientId } = await setUpVisit();
    const reported = await request(app)
      .post(`/v1/patients/${patientId}/incidents`)
      .set(caregiver.header)
      .send(fall);
    expect(reported.status).toBe(201);
    expect(reported.body.data).toMatchObject({ status: 'OPEN', reportedBy: 'Chika Eze' });

    const byCaregiver = await request(app)
      .post(`/v1/patients/${patientId}/incidents/${reported.body.data.id}/resolve`)
      .set(caregiver.header)
      .send({ resolutionNote: 'Seen by a doctor, no fracture.' });
    expect(byCaregiver.status).toBe(403);

    const byOwner = await request(app)
      .post(`/v1/patients/${patientId}/incidents/${reported.body.data.id}/resolve`)
      .set(owner.header)
      .send({ resolutionNote: 'Seen by a doctor, no fracture.' });
    expect(byOwner.body.data).toMatchObject({ status: 'RESOLVED', resolvedBy: 'Adaeze Okafor' });
  });

  it('lists open incidents first', async () => {
    const { owner, patientId } = await setUpVisit();
    const first = await request(app)
      .post(`/v1/patients/${patientId}/incidents`)
      .set(owner.header)
      .send(fall);
    await request(app)
      .post(`/v1/patients/${patientId}/incidents/${first.body.data.id}/resolve`)
      .set(owner.header)
      .send({ resolutionNote: 'Handled the same day.' });
    await request(app)
      .post(`/v1/patients/${patientId}/incidents`)
      .set(owner.header)
      .send({ ...fall, category: 'HEALTH_CHANGE', severity: 'MEDIUM' });

    const list = await request(app).get(`/v1/patients/${patientId}/incidents`).set(owner.header);
    expect(list.body.data.map((incident: { status: string }) => incident.status)).toEqual([
      'OPEN',
      'RESOLVED',
    ]);
  });

  it('refuses incidents dated in the future', async () => {
    const { owner, patientId } = await setUpVisit();
    const response = await request(app)
      .post(`/v1/patients/${patientId}/incidents`)
      .set(owner.header)
      .send({ ...fall, occurredAt: new Date(Date.now() + 2 * HOUR_MS).toISOString() });
    expect(response.status).toBe(400);
  });
});
