import '@/test/mock-jwks';

import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { StoredPhoto } from '@/lib/photo-storage/photo-storage';
import { signUpWithProfile, type SignedInUser } from '@/test/api-client';
import { resetDatabase } from '@/test/reset-database';

const uploaded = new Map<string, StoredPhoto>();
const removed: string[] = [];

vi.mock('@/lib/photo-storage/supabase-photo-storage', () => ({
  PHOTO_LIMITS: { MAX_PHOTO_BYTES: 3 * 1024 * 1024, ALLOWED_TYPES: ['image/jpeg'] },
  supabasePhotoStorage: {
    isConfigured: true,
    createUploadUrl: async (path: string) => `https://storage.example/upload/${path}`,
    describe: async (path: string) => uploaded.get(path) ?? null,
    createViewUrl: async (path: string) => `https://storage.example/view/${path}?token=short`,
    remove: async (path: string) => {
      removed.push(path);
    },
  },
}));

const { createApp } = await import('@/app');
const { prisma } = await import('@/lib/prisma');

const app = createApp();

async function join(owner: SignedInUser, patientId: string) {
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
  return caregiver;
}

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
  return { owner, patientId, base: `/v1/patients/${patientId}/health-profile` };
}

beforeEach(async () => {
  await resetDatabase(prisma);
  uploaded.clear();
  removed.length = 0;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('health profile', () => {
  it('lets the owner keep medicines, allergies and conditions that the caregiver can read', async () => {
    const { owner, patientId, base } = await setUp();
    const caregiver = await join(owner, patientId);

    await request(app)
      .post(`${base}/medications`)
      .set(owner.header)
      .send({ name: 'Amlodipine', dose: '5 mg', instructions: 'One tablet every morning' })
      .expect(201);
    await request(app)
      .post(`${base}/allergies`)
      .set(owner.header)
      .send({ substance: 'Penicillin', reaction: 'Rash', severity: 'SEVERE' })
      .expect(201);
    await request(app)
      .post(`${base}/conditions`)
      .set(owner.header)
      .send({ name: 'High blood pressure', diagnosedOn: '2019-04-02' })
      .expect(201);

    const profile = await request(app).get(base).set(caregiver.header);
    expect(profile.body.data.medications[0]).toMatchObject({
      name: 'Amlodipine',
      stoppedAt: null,
      addedBy: 'Adaeze Okafor',
    });
    expect(profile.body.data.allergies[0]).toMatchObject({ substance: 'Penicillin' });
    expect(profile.body.data.conditions[0]).toMatchObject({ diagnosedOn: '2019-04-02' });
  });

  it('only lets the owner change the record', async () => {
    const { owner, patientId, base } = await setUp();
    const caregiver = await join(owner, patientId);
    const response = await request(app)
      .post(`${base}/medications`)
      .set(caregiver.header)
      .send({ name: 'Paracetamol' });
    expect(response.status).toBe(403);
  });

  it('keeps stopped medicines as history', async () => {
    const { owner, base } = await setUp();
    const created = await request(app)
      .post(`${base}/medications`)
      .set(owner.header)
      .send({ name: 'Metformin' });
    await request(app)
      .post(`${base}/medications/${created.body.data.id}/stop`)
      .set(owner.header)
      .expect(204);
    await request(app)
      .post(`${base}/medications/${created.body.data.id}/stop`)
      .set(owner.header)
      .expect(404);

    const profile = await request(app).get(base).set(owner.header);
    expect(profile.body.data.medications[0].stoppedAt).not.toBeNull();
  });

  it('records who removed an allergy', async () => {
    const { owner, base } = await setUp();
    const created = await request(app)
      .post(`${base}/allergies`)
      .set(owner.header)
      .send({ substance: 'Peanuts', severity: 'MILD' });
    await request(app)
      .delete(`${base}/allergies/${created.body.data.id}`)
      .set(owner.header)
      .expect(204);

    const audit = await prisma.auditEvent.findFirst({
      where: { action: 'health_profile.entry_removed' },
    });
    expect(audit).toMatchObject({ entityType: 'allergy', entityId: created.body.data.id });
  });

  it('hides the record from strangers', async () => {
    const { base } = await setUp();
    const stranger = await signUpWithProfile(app, 'FAMILY');
    expect((await request(app).get(base).set(stranger.header)).status).toBe(404);
  });
});

describe('health documents', () => {
  it('adds an uploaded photo and removes it from storage when deleted', async () => {
    const { owner, base } = await setUp();
    const upload = await request(app).post(`${base}/documents/upload`).set(owner.header);
    const { path } = upload.body.data;
    uploaded.set(path, { sizeBytes: 200_000, contentType: 'image/jpeg', createdAt: new Date() });

    const added = await request(app)
      .post(`${base}/documents`)
      .set(owner.header)
      .send({ title: 'Blood test, March', path });
    expect(added.status).toBe(201);

    const view = await request(app)
      .get(`${base}/documents/${added.body.data.id}`)
      .set(owner.header);
    expect(view.body.data.url).toContain(path);

    await request(app)
      .delete(`${base}/documents/${added.body.data.id}`)
      .set(owner.header)
      .expect(204);
    expect(removed).toEqual([path]);
  });

  it("refuses a photo from another patient's folder", async () => {
    const { owner, base } = await setUp();
    const response = await request(app)
      .post(`${base}/documents`)
      .set(owner.header)
      .send({ title: 'Scan', path: 'documents/someone-else/x.jpg' });
    expect(response.status).toBe(400);
  });
});
