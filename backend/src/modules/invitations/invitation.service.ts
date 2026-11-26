import {
  formatInvitationCode,
  INVITATION_EXPIRY_DAYS,
  PATIENT_EDITOR_RELATIONSHIPS,
  ROLE_REQUIRED_FOR_RELATIONSHIP,
  type CreateInvitationInput,
  type InvitableRelationship,
} from '@welcheq/shared';

import { AUDIT_ACTION, recordAuditEvent } from '@/lib/audit';
import { HttpError } from '@/lib/http-error';
import { generateInvitationCode, hashInvitationCode } from '@/lib/invitation-code';
import { prisma } from '@/lib/prisma';
import type { ActingUser } from '@/middleware/require-profile';
import { requirePatientAccess } from '@/modules/patients/patient-access';
import { invitationRepository } from './invitation.repository';

const DAY_MS = 86_400_000;
const ENTITY_TYPE = 'invitation';

const INVALID_CODE_MESSAGE = 'This code is not valid or has expired. Ask for a new one.';

const ROLE_MISMATCH_MESSAGE: Readonly<Record<InvitableRelationship, string>> = {
  CAREGIVER: 'This code is for a caregiver account.',
  FAMILY_VIEWER: 'This code is for a family member account.',
};

export const invitationService = {
  async create(user: ActingUser, patientId: string, input: CreateInvitationInput) {
    await requirePatientAccess(user, patientId, PATIENT_EDITOR_RELATIONSHIPS);

    const code = generateInvitationCode();
    const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * DAY_MS);

    const invitation = await prisma.$transaction(async (tx) => {
      const created = await invitationRepository.create(tx, {
        patientId,
        relationship: input.relationship,
        codeHash: hashInvitationCode(code),
        createdById: user.id,
        expiresAt,
      });
      await recordAuditEvent(tx, {
        actorId: user.id,
        action: AUDIT_ACTION.INVITATION_CREATED,
        entityType: ENTITY_TYPE,
        entityId: created.id,
        metadata: { patientId, relationship: input.relationship },
      });
      return created;
    });

    return { ...invitation, code: formatInvitationCode(code) };
  },

  async listPending(user: ActingUser, patientId: string) {
    await requirePatientAccess(user, patientId, PATIENT_EDITOR_RELATIONSHIPS);
    return invitationRepository.listPending(patientId, new Date());
  },

  async revoke(user: ActingUser, patientId: string, invitationId: string) {
    await requirePatientAccess(user, patientId, PATIENT_EDITOR_RELATIONSHIPS);

    await prisma.$transaction(async (tx) => {
      const { count } = await invitationRepository.revoke(tx, patientId, invitationId, new Date());
      if (count === 0) {
        throw HttpError.notFound('Invitation not found');
      }
      await recordAuditEvent(tx, {
        actorId: user.id,
        action: AUDIT_ACTION.INVITATION_REVOKED,
        entityType: ENTITY_TYPE,
        entityId: invitationId,
      });
    });
  },

  async accept(user: ActingUser, normalizedCode: string) {
    const now = new Date();
    const invitation = await invitationRepository.findByCodeHash(
      hashInvitationCode(normalizedCode),
    );

    const isUsable =
      invitation &&
      !invitation.acceptedAt &&
      !invitation.revokedAt &&
      !invitation.patient.archivedAt &&
      invitation.expiresAt > now;

    if (!isUsable) {
      throw HttpError.notFound(INVALID_CODE_MESSAGE);
    }

    const relationship = invitation.relationship as InvitableRelationship;
    if (ROLE_REQUIRED_FOR_RELATIONSHIP[relationship] !== user.role) {
      throw HttpError.forbidden(ROLE_MISMATCH_MESSAGE[relationship]);
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.patientAccess.findUnique({
        where: { patientId_userId: { patientId: invitation.patientId, userId: user.id } },
        select: { revokedAt: true },
      });
      if (existing && !existing.revokedAt) {
        throw HttpError.conflict(`You already help care for ${invitation.patient.fullName}.`);
      }

      const { count } = await invitationRepository.markAccepted(tx, invitation.id, user.id, now);
      if (count === 0) {
        throw HttpError.notFound(INVALID_CODE_MESSAGE);
      }

      await tx.patientAccess.upsert({
        where: { patientId_userId: { patientId: invitation.patientId, userId: user.id } },
        create: { patientId: invitation.patientId, userId: user.id, relationship },
        update: { relationship, revokedAt: null, createdAt: now },
      });
      await recordAuditEvent(tx, {
        actorId: user.id,
        action: AUDIT_ACTION.INVITATION_ACCEPTED,
        entityType: ENTITY_TYPE,
        entityId: invitation.id,
        metadata: { patientId: invitation.patientId, relationship },
      });
    });

    return {
      patientId: invitation.patientId,
      patientName: invitation.patient.fullName,
      relationship,
    };
  },
};
