import '@/test/mock-jwks';

import { addDays, localMoment } from '@welcheq/shared';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { signUpWithProfile, type SignedInUser } from '@/test/api-client';
import { resetDatabase } from '@/test/reset-database';

const { createApp } = await import('@/app');
const { prisma } = await import('@/lib/prisma');

const app = createApp();
const MINUTE_MS = 60_000;

const HOME = { latitude: 6.4413, longitude: 7.4988 };
const AT_HOME = { latitude: HOME.latitude + 0.0005, longitude: HOME.longitude, accuracyMeters: 15 };
const ACROSS_TOWN = {
  latitude: HOME.latitude + 0.01,
  longitude: HOME.longitude,
  accuracyMeters: 15,
};

const today = () => localMoment(new Date(), 'Africa/Lagos').date;

function attendanceEvent(location = AT_HOME, overrides: Record<string, unknown> = {}) {
  return { location, capturedAt: new Date().toISOString(), ...overrides };
}

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

const checkIn = (caregiver: SignedInUser, patientId: string, body = attendanceEvent()) =>
  request(app).post(`/v1/patients/${patientId}/visits/check-in`).set(caregiver.header).send(body);

async function createShift(patientId: string, caregiverId: string, startOffsetMinutes: number) {
  const startsAt = new Date(Date.now() + startOffsetMinutes * MINUTE_MS);
  return prisma.shift.create({
    data: {
      patientId,
      caregiverId,
      startsAt,
      endsAt: new Date(startsAt.getTime() + 4 * 60 * MINUTE_MS),
      createdById: caregiverId,
    },
  });
}

beforeEach(async () => {
  await resetDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('check-in', () => {
  it('works at the home and opens a visit', async () => {
    const { caregiver, patientId } = await setUp();
    const response = await checkIn(caregiver, patientId);

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ isOpen: true, flags: [] });

    const open = await request(app).get('/v1/me/visits/open').set(caregiver.header);
    expect(open.body.data.id).toBe(response.body.data.id);
  });

  it('refuses check-in away from the home and says how far', async () => {
    const { caregiver, patientId } = await setUp();
    const response = await checkIn(caregiver, patientId, attendanceEvent(ACROSS_TOWN));

    expect(response.status).toBe(400);
    expect(response.body.error.message).toMatch(/about 1112 m from the home/);
  });

  it('refuses imprecise locations', async () => {
    const { caregiver, patientId } = await setUp();
    const response = await checkIn(
      caregiver,
      patientId,
      attendanceEvent({ ...AT_HOME, accuracyMeters: 800 }),
    );
    expect(response.status).toBe(400);
  });

  it('allows only one open visit, even when two requests race', async () => {
    const { caregiver, patientId } = await setUp();
    const [first, second] = await Promise.all([
      checkIn(caregiver, patientId),
      checkIn(caregiver, patientId),
    ]);
    expect([first.status, second.status].sort()).toEqual([201, 409]);
  });

  it('is only for caregivers', async () => {
    const { owner, patientId } = await setUp();
    const response = await checkIn(owner, patientId);
    expect(response.status).toBe(403);
  });

  it('flags fake location apps', async () => {
    const { caregiver, patientId } = await setUp();
    const response = await checkIn(
      caregiver,
      patientId,
      attendanceEvent({ ...AT_HOME, isMocked: true } as typeof AT_HOME),
    );
    expect(response.body.data.flags).toContain('MOCK_LOCATION');
  });

  it('ignores the phone clock unless the check-in was made offline', async () => {
    const { caregiver, patientId } = await setUp();
    const wrongClock = new Date(Date.now() - 3 * 60 * MINUTE_MS).toISOString();
    const response = await checkIn(
      caregiver,
      patientId,
      attendanceEvent(AT_HOME, { capturedAt: wrongClock }),
    );
    const checkInAt = new Date(response.body.data.checkInAt).getTime();
    expect(Math.abs(checkInAt - Date.now())).toBeLessThan(MINUTE_MS);
  });

  it('accepts recent offline check-ins with their real time and a flag', async () => {
    const { caregiver, patientId } = await setUp();
    const capturedAt = new Date(Date.now() - 30 * MINUTE_MS).toISOString();
    const response = await checkIn(
      caregiver,
      patientId,
      attendanceEvent(AT_HOME, { capturedAt, isOffline: true }),
    );
    expect(response.status).toBe(201);
    expect(response.body.data.checkInAt).toBe(capturedAt);
    expect(response.body.data.flags).toContain('RECORDED_OFFLINE');
  });

  it('refuses offline check-ins dated in the future', async () => {
    const { caregiver, patientId } = await setUp();
    const capturedAt = new Date(Date.now() + 60 * MINUTE_MS).toISOString();
    const response = await checkIn(
      caregiver,
      patientId,
      attendanceEvent(AT_HOME, { capturedAt, isOffline: true }),
    );
    expect(response.status).toBe(400);
  });
});

describe('check-out', () => {
  it('closes the visit and flags leaving from elsewhere', async () => {
    const { caregiver, patientId } = await setUp();
    const visit = await checkIn(caregiver, patientId);

    const response = await request(app)
      .post(`/v1/patients/${patientId}/visits/${visit.body.data.id}/check-out`)
      .set(caregiver.header)
      .send(attendanceEvent(ACROSS_TOWN));

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ isOpen: false });
    expect(response.body.data.flags).toContain('CHECKED_OUT_AWAY');

    const open = await request(app).get('/v1/me/visits/open').set(caregiver.header);
    expect(open.body.data).toBeNull();
  });
});

describe('schedule', () => {
  const tomorrowShift = (caregiverId: string, overrides: Record<string, unknown> = {}) => ({
    caregiverId,
    date: addDays(today(), 1),
    startTime: '08:00',
    endTime: '16:00',
    ...overrides,
  });

  it('creates repeating weekly visits', async () => {
    const { owner, caregiver, patientId } = await setUp();
    await request(app)
      .post(`/v1/patients/${patientId}/shifts`)
      .set(owner.header)
      .send(tomorrowShift(caregiver.userId, { repeatWeeks: 2 }))
      .expect(201);

    const shifts = await request(app)
      .get(`/v1/patients/${patientId}/shifts?from=${today()}&to=${addDays(today(), 20)}`)
      .set(owner.header);
    expect(shifts.body.data).toHaveLength(3);
    expect(shifts.body.data[0]).toMatchObject({
      status: 'SCHEDULED',
      caregiver: { fullName: 'Chika Eze' },
    });
  });

  it('refuses overlapping visits for the same caregiver', async () => {
    const { owner, caregiver, patientId } = await setUp();
    const url = `/v1/patients/${patientId}/shifts`;
    await request(app)
      .post(url)
      .set(owner.header)
      .send(tomorrowShift(caregiver.userId))
      .expect(201);

    const clash = await request(app)
      .post(url)
      .set(owner.header)
      .send(tomorrowShift(caregiver.userId, { startTime: '12:00', endTime: '18:00' }));
    expect(clash.status).toBe(409);
  });

  it('only schedules caregivers on the care team', async () => {
    const { owner, patientId } = await setUp();
    const outsider = await signUpWithProfile(app, 'CAREGIVER');
    const response = await request(app)
      .post(`/v1/patients/${patientId}/shifts`)
      .set(owner.header)
      .send(tomorrowShift(outsider.userId));
    expect(response.status).toBe(400);
  });

  it('does not let caregivers schedule themselves', async () => {
    const { caregiver, patientId } = await setUp();
    const response = await request(app)
      .post(`/v1/patients/${patientId}/shifts`)
      .set(caregiver.header)
      .send(tomorrowShift(caregiver.userId));
    expect(response.status).toBe(403);
  });

  it('attaches a late check-in to its visit and flags it', async () => {
    const { owner, caregiver, patientId } = await setUp();
    await createShift(patientId, caregiver.userId, -30);
    await checkIn(caregiver, patientId).expect(201);

    const shifts = await request(app)
      .get(`/v1/patients/${patientId}/shifts?from=${addDays(today(), -1)}&to=${today()}`)
      .set(owner.header);
    expect(shifts.body.data[0]).toMatchObject({ status: 'IN_PROGRESS', isLate: true });
    expect(shifts.body.data[0].visit.flags).toContain('LATE_ARRIVAL');
  });

  it('marks a visit missed when nobody checks in', async () => {
    const { owner, caregiver, patientId } = await setUp();
    await createShift(patientId, caregiver.userId, -120);

    const shifts = await request(app)
      .get(`/v1/patients/${patientId}/shifts?from=${addDays(today(), -1)}&to=${today()}`)
      .set(owner.header);
    expect(shifts.body.data[0].status).toBe('MISSED');
  });

  it('cancels visits that have not started', async () => {
    const { owner, caregiver, patientId } = await setUp();
    const shift = await createShift(patientId, caregiver.userId, 120);

    await request(app)
      .delete(`/v1/patients/${patientId}/shifts/${shift.id}`)
      .set(owner.header)
      .expect(204);
    const mine = await request(app)
      .get(`/v1/me/shifts?from=${today()}&to=${addDays(today(), 1)}`)
      .set(caregiver.header);
    expect(mine.body.data[0].status).toBe('CANCELLED');
  });

  it('never shows another family’s schedule', async () => {
    const { patientId } = await setUp();
    const stranger = await signUpWithProfile(app, 'FAMILY');
    const response = await request(app)
      .get(`/v1/patients/${patientId}/shifts?from=${today()}&to=${today()}`)
      .set(stranger.header);
    expect(response.status).toBe(404);
  });
});
