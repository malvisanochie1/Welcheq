import { randomUUID } from 'node:crypto';

import { CARE_RELATIONSHIP, OFFLINE_SYNC } from '@welcheq/shared';

import { HttpError } from '@/lib/http-error';
import { prisma } from '@/lib/prisma';
import { PHOTO_LIMITS, supabasePhotoStorage } from '@/lib/photo-storage/supabase-photo-storage';
import type { ActingUser } from '@/middleware/require-profile';
import { requirePatientAccess } from '@/modules/patients/patient-access';

const MINUTE_MS = 60_000;
const SELFIE_FRESH_MINUTES = 10;
const VIEW_URL_SECONDS = 300;
const UUID_FILE = /^[0-9a-f-]{36}\.jpg$/;

const NOT_CONFIGURED_MESSAGE = 'Photo storage has not been set up yet.';

const selfieFolder = (patientId: string, caregiverId: string) => `${patientId}/${caregiverId}`;

export const selfieService = {
  get isAvailable() {
    return supabasePhotoStorage.isConfigured;
  },

  async requestUpload(user: ActingUser, patientId: string) {
    await requirePatientAccess(user, patientId, [CARE_RELATIONSHIP.CAREGIVER]);
    if (!supabasePhotoStorage.isConfigured) {
      throw HttpError.conflict(NOT_CONFIGURED_MESSAGE);
    }

    const path = `${selfieFolder(patientId, user.id)}/${randomUUID()}.jpg`;
    return { path, uploadUrl: await supabasePhotoStorage.createUploadUrl(path) };
  },

  /**
   * A selfie counts only if it sits in this caregiver's folder for this patient, is a real
   * image within the size limit, and was uploaded around the time of the check-in.
   */
  async verify(path: string | undefined, patientId: string, caregiverId: string, checkInAt: Date) {
    if (!path) {
      throw HttpError.invalid('Take a selfie to check in.');
    }

    const folder = selfieFolder(patientId, caregiverId);
    const fileName = path.slice(folder.length + 1);
    if (!path.startsWith(`${folder}/`) || !UUID_FILE.test(fileName)) {
      throw HttpError.invalid('That photo cannot be used for this check-in.');
    }

    const photo = await supabasePhotoStorage.describe(path);
    if (!photo) {
      throw HttpError.invalid('The selfie did not upload. Please take it again.');
    }

    const earliest = checkInAt.getTime() - SELFIE_FRESH_MINUTES * MINUTE_MS;
    const latest = Date.now() + OFFLINE_SYNC.MAX_CLOCK_SKEW_SECONDS * 1000;
    const isFresh = photo.createdAt.getTime() >= earliest && photo.createdAt.getTime() <= latest;
    const isValidImage =
      photo.sizeBytes > 0 &&
      photo.sizeBytes <= PHOTO_LIMITS.MAX_PHOTO_BYTES &&
      PHOTO_LIMITS.ALLOWED_TYPES.includes(photo.contentType);

    if (!isFresh || !isValidImage) {
      throw HttpError.invalid('Please take a new selfie now to check in.');
    }
  },

  async viewUrl(user: ActingUser, patientId: string, visitId: string) {
    await requirePatientAccess(user, patientId);
    const visit = await prisma.visit.findFirst({
      where: { id: visitId, patientId },
      select: { selfiePath: true },
    });
    if (!visit?.selfiePath) {
      throw HttpError.notFound('No selfie for this visit');
    }

    return {
      url: await supabasePhotoStorage.createViewUrl(visit.selfiePath, VIEW_URL_SECONDS),
      expiresAt: new Date(Date.now() + VIEW_URL_SECONDS * 1000),
    };
  },
};
