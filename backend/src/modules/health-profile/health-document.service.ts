import { randomUUID } from 'node:crypto';

import { PATIENT_EDITOR_RELATIONSHIPS } from '@welcheq/shared';

import { AUDIT_ACTION, recordAuditEvent } from '@/lib/audit';
import { HttpError } from '@/lib/http-error';
import { PHOTO_LIMITS, supabasePhotoStorage } from '@/lib/photo-storage/supabase-photo-storage';
import { prisma } from '@/lib/prisma';
import type { ActingUser } from '@/middleware/require-profile';
import { requirePatientAccess } from '@/modules/patients/patient-access';

const VIEW_URL_SECONDS = 300;
const MAX_DOCUMENTS = 100;
const UUID_FILE = /^[0-9a-f-]{36}\.jpg$/;

const documentFolder = (patientId: string) => `documents/${patientId}`;

const DOCUMENT_FIELDS = {
  id: true,
  title: true,
  createdAt: true,
  uploadedBy: { select: { fullName: true } },
} as const;

function requireStorage() {
  if (!supabasePhotoStorage.isConfigured) {
    throw HttpError.conflict('Document storage has not been set up yet.');
  }
}

export const healthDocumentService = {
  async list(user: ActingUser, patientId: string) {
    await requirePatientAccess(user, patientId);
    const documents = await prisma.healthDocument.findMany({
      where: { patientId },
      select: DOCUMENT_FIELDS,
      orderBy: { createdAt: 'desc' },
    });
    return documents.map(({ uploadedBy, ...document }) => ({
      ...document,
      uploadedBy: uploadedBy.fullName,
    }));
  },

  async requestUpload(user: ActingUser, patientId: string) {
    await requirePatientAccess(user, patientId, PATIENT_EDITOR_RELATIONSHIPS);
    requireStorage();
    const path = `${documentFolder(patientId)}/${randomUUID()}.jpg`;
    return { path, uploadUrl: await supabasePhotoStorage.createUploadUrl(path) };
  },

  async add(user: ActingUser, patientId: string, title: string, path: string) {
    await requirePatientAccess(user, patientId, PATIENT_EDITOR_RELATIONSHIPS);
    requireStorage();

    const folder = documentFolder(patientId);
    if (!path.startsWith(`${folder}/`) || !UUID_FILE.test(path.slice(folder.length + 1))) {
      throw HttpError.invalid('That photo cannot be added to this record.');
    }
    const photo = await supabasePhotoStorage.describe(path);
    const isValidImage =
      photo !== null &&
      photo.sizeBytes > 0 &&
      photo.sizeBytes <= PHOTO_LIMITS.MAX_PHOTO_BYTES &&
      PHOTO_LIMITS.ALLOWED_TYPES.includes(photo.contentType);
    if (!isValidImage) {
      throw HttpError.invalid('The photo did not upload. Please try again.');
    }
    if ((await prisma.healthDocument.count({ where: { patientId } })) >= MAX_DOCUMENTS) {
      throw HttpError.conflict('The record is full. Remove an old document first.');
    }

    const document = await prisma.$transaction(async (tx) => {
      const created = await tx.healthDocument.create({
        data: { patientId, title, storagePath: path, uploadedById: user.id },
        select: DOCUMENT_FIELDS,
      });
      await recordAuditEvent(tx, {
        actorId: user.id,
        action: AUDIT_ACTION.HEALTH_DOCUMENT_ADDED,
        entityType: 'health_document',
        entityId: created.id,
      });
      return created;
    });
    return { ...document, uploadedBy: document.uploadedBy.fullName };
  },

  async viewUrl(user: ActingUser, patientId: string, documentId: string) {
    await requirePatientAccess(user, patientId);
    const document = await prisma.healthDocument.findFirst({
      where: { id: documentId, patientId },
      select: { storagePath: true },
    });
    if (!document) {
      throw HttpError.notFound('Document not found');
    }
    return {
      url: await supabasePhotoStorage.createViewUrl(document.storagePath, VIEW_URL_SECONDS),
      expiresAt: new Date(Date.now() + VIEW_URL_SECONDS * 1000),
    };
  },

  async remove(user: ActingUser, patientId: string, documentId: string) {
    await requirePatientAccess(user, patientId, PATIENT_EDITOR_RELATIONSHIPS);
    const document = await prisma.healthDocument.findFirst({
      where: { id: documentId, patientId },
      select: { storagePath: true },
    });
    if (!document) {
      throw HttpError.notFound('Document not found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.healthDocument.delete({ where: { id: documentId } });
      await recordAuditEvent(tx, {
        actorId: user.id,
        action: AUDIT_ACTION.HEALTH_DOCUMENT_REMOVED,
        entityType: 'health_document',
        entityId: documentId,
      });
    });
    await supabasePhotoStorage.remove(document.storagePath);
  },
};
