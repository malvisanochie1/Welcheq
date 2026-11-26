import '@/test/mock-jwks';

import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { StoredPhoto } from '@/lib/photo-storage/photo-storage';
import { signUpWithProfile, type SignedInUser } from '@/test/api-client';
import { resetDatabase } from '@/test/reset-database';

const uploaded = new Map<string, StoredPhoto>();

vi.mock('@/lib/photo-storage/supabase-photo-storage', () => ({
  PHOTO_LIMITS: { MAX_PHOTO_BYTES: 3 * 1024 * 1024, ALLOWED_TYPES: ['image/jpeg'] },
  supabasePhotoStorage: {
    isConfigured: true,
    createUploadUrl: async (path: string) => `https://storage.example/upload/${path}`,
    describe: async (path: string) => uploaded.get(path) ?? null,
    createViewUrl: async (path: string) => `https://storage.example/view/${path}?token=short`,
  },
}));

const { createApp } = await import('@/app');
const { prisma } = await import('@/lib/prisma');

const app = createApp();
const MINUTE_MS = 60_000;
const HOME = { latitude: 6.4413, longitude: 7.4988 };
const AT_HOME = { latitude: HOME.latitude + 0.0005, longitude: HOME.longitude, accuracyMeters: 15 };

function simulateUpload(path: string, overrides: Partial<StoredPhoto> = {}) {
  uploaded.set(path, {
    sizeBytes: 180_000,
    contentType: 'image/jpeg',
    createdAt: new Date(),
    ...overrides,
  });
}

async function setUp() {
  const owner = await signUpWithProfile(app, 'FAMILY');
  const patient = await request(app)
    .post('/v1/patients')
    .set(owner.header)
    .send({ fullName: 'Ngozi Okafor', homeAddress: '12 Ogui Road, Enugu', homeLocation: HOME });
  const patientId = patient.body.data.id as string;
  await request(app)
    .put(`/v1/patients/${patientId}/proof-settings`)
    .set(owner.header)
    .send({ methods: ['LOCATION', 'SELFIE'], geofenceRadiusMeters: 150 })
    .expect(200);

  const caregiver = await signUpWithProfile(app, 'CAREGIVER');
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

async function requestUpload(caregiver: SignedInUser, patientId: string) {
  const response = await request(app)
    .post(`/v1/patients/${patientId}/visits/selfie-upload`)
    .set(caregiver.header)
    .expect(201);
  return response.body.data.path as string;
}

const checkIn = (caregiver: SignedInUser, patientId: string, selfiePath?: string) =>
  request(app)
    .post(`/v1/patients/${patientId}/visits/check-in`)
    .set(caregiver.header)
    .send({ location: AT_HOME, capturedAt: new Date().toISOString(), selfiePath });

beforeEach(async () => {
  uploaded.clear();
  await resetDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('selfie at check-in', () => {
  it('accepts a fresh selfie and lets the family view it briefly', async () => {
    const { owner, caregiver, patientId } = await setUp();
    const path = await requestUpload(caregiver, patientId);
    simulateUpload(path);

    const visit = await checkIn(caregiver, patientId, path);
    expect(visit.status).toBe(201);
    expect(visit.body.data.hasSelfie).toBe(true);

    const view = await request(app)
      .get(`/v1/patients/${patientId}/visits/${visit.body.data.id}/selfie`)
      .set(owner.header);
    expect(view.status).toBe(200);
    expect(view.headers['cache-control']).toBe('no-store');
    expect(view.body.data.url).toContain('token=short');
  });

  it('is required when switched on', async () => {
    const { caregiver, patientId } = await setUp();
    const response = await checkIn(caregiver, patientId);
    expect(response.status).toBe(400);
  });

  it('refuses a photo that was never uploaded', async () => {
    const { caregiver, patientId } = await setUp();
    const path = await requestUpload(caregiver, patientId);
    const response = await checkIn(caregiver, patientId, path);
    expect(response.status).toBe(400);
  });

  it('refuses an old photo', async () => {
    const { caregiver, patientId } = await setUp();
    const path = await requestUpload(caregiver, patientId);
    simulateUpload(path, { createdAt: new Date(Date.now() - 45 * MINUTE_MS) });
    const response = await checkIn(caregiver, patientId, path);
    expect(response.status).toBe(400);
  });

  it('refuses another caregiver’s photo', async () => {
    const { owner, caregiver, patientId } = await setUp();
    const other = await signUpWithProfile(app, 'CAREGIVER');
    const invitation = await request(app)
      .post(`/v1/patients/${patientId}/invitations`)
      .set(owner.header)
      .send({ relationship: 'CAREGIVER' });
    await request(app)
      .post('/v1/invitations/accept')
      .set(other.header)
      .send({ code: invitation.body.data.code })
      .expect(200);

    const path = await requestUpload(caregiver, patientId);
    simulateUpload(path);
    const response = await checkIn(other, patientId, path);
    expect(response.status).toBe(400);
  });

  it('never accepts the same selfie twice', async () => {
    const { caregiver, patientId } = await setUp();
    const path = await requestUpload(caregiver, patientId);
    simulateUpload(path);
    const first = await checkIn(caregiver, patientId, path).expect(201);

    await request(app)
      .post(`/v1/patients/${patientId}/visits/${first.body.data.id}/check-out`)
      .set(caregiver.header)
      .send({ location: AT_HOME, capturedAt: new Date().toISOString() })
      .expect(200);

    const reuse = await checkIn(caregiver, patientId, path);
    expect(reuse.status).toBe(409);
  });

  it('hides selfies from people outside the care team', async () => {
    const { caregiver, patientId } = await setUp();
    const path = await requestUpload(caregiver, patientId);
    simulateUpload(path);
    const visit = await checkIn(caregiver, patientId, path).expect(201);

    const stranger = await signUpWithProfile(app, 'FAMILY');
    const view = await request(app)
      .get(`/v1/patients/${patientId}/visits/${visit.body.data.id}/selfie`)
      .set(stranger.header);
    expect(view.status).toBe(404);
  });
});
