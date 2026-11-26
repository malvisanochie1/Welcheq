import { formatInvitationCode, PATIENT_EDITOR_RELATIONSHIPS, ROTATING_CODE } from '@welcheq/shared';

import { AUDIT_ACTION, recordAuditEvent } from '@/lib/audit';
import { HttpError } from '@/lib/http-error';
import { prisma } from '@/lib/prisma';
import {
  generateHomeCodeSecret,
  generateInvitationCode,
  hashInvitationCode,
} from '@/lib/secure-codes';
import type { ActingUser } from '@/middleware/require-profile';
import { requirePatientAccess } from '@/modules/patients/patient-access';

const PAIRING_VALID_MINUTES = 15;
const MINUTE_MS = 60_000;
const ENTITY_TYPE = 'patient';
const INVALID_PAIRING_MESSAGE = 'This setup code is not valid or has expired. Ask for a new one.';

export const homeDisplayService = {
  async createPairing(user: ActingUser, patientId: string) {
    await requirePatientAccess(user, patientId, PATIENT_EDITOR_RELATIONSHIPS);

    const code = generateInvitationCode();
    const expiresAt = new Date(Date.now() + PAIRING_VALID_MINUTES * MINUTE_MS);

    await prisma.$transaction(async (tx) => {
      const patient = await tx.patient.findUniqueOrThrow({
        where: { id: patientId },
        select: { homeCodeSecret: true },
      });
      if (!patient.homeCodeSecret) {
        await tx.patient.update({
          where: { id: patientId },
          data: { homeCodeSecret: generateHomeCodeSecret() },
        });
      }
      await tx.homeDisplayPairing.create({
        data: { patientId, codeHash: hashInvitationCode(code), createdById: user.id, expiresAt },
      });
      await recordAuditEvent(tx, {
        actorId: user.id,
        action: AUDIT_ACTION.HOME_DISPLAY_PAIRING_CREATED,
        entityType: ENTITY_TYPE,
        entityId: patientId,
      });
    });

    return { code: formatInvitationCode(code), expiresAt };
  },

  /** Rotating the secret stops every paired display at once, e.g. after a device is lost. */
  async reset(user: ActingUser, patientId: string) {
    await requirePatientAccess(user, patientId, PATIENT_EDITOR_RELATIONSHIPS);

    await prisma.$transaction(async (tx) => {
      await tx.patient.update({
        where: { id: patientId },
        data: { homeCodeSecret: generateHomeCodeSecret() },
      });
      await tx.homeDisplayPairing.updateMany({
        where: { patientId, usedAt: null },
        data: { expiresAt: new Date() },
      });
      await recordAuditEvent(tx, {
        actorId: user.id,
        action: AUDIT_ACTION.HOME_DISPLAY_RESET,
        entityType: ENTITY_TYPE,
        entityId: patientId,
      });
    });
  },

  async pair(normalizedCode: string) {
    const now = new Date();
    const pairing = await prisma.homeDisplayPairing.findUnique({
      where: { codeHash: hashInvitationCode(normalizedCode) },
      select: {
        id: true,
        usedAt: true,
        expiresAt: true,
        patient: { select: { id: true, fullName: true, homeCodeSecret: true, archivedAt: true } },
      },
    });

    const secret = pairing?.patient.homeCodeSecret;
    if (
      !pairing ||
      pairing.usedAt ||
      pairing.expiresAt <= now ||
      !secret ||
      pairing.patient.archivedAt
    ) {
      throw HttpError.notFound(INVALID_PAIRING_MESSAGE);
    }

    await prisma.$transaction(async (tx) => {
      const { count } = await tx.homeDisplayPairing.updateMany({
        where: { id: pairing.id, usedAt: null },
        data: { usedAt: now },
      });
      if (count === 0) {
        throw HttpError.notFound(INVALID_PAIRING_MESSAGE);
      }
      await recordAuditEvent(tx, {
        actorId: null,
        action: AUDIT_ACTION.HOME_DISPLAY_PAIRED,
        entityType: ENTITY_TYPE,
        entityId: pairing.patient.id,
      });
    });

    return {
      patientFirstName: pairing.patient.fullName.split(' ')[0] ?? pairing.patient.fullName,
      secret,
      periodSeconds: ROTATING_CODE.PERIOD_SECONDS,
      digits: ROTATING_CODE.DIGITS,
    };
  },
};
