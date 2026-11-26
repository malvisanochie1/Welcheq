import type { CareRelationship } from '@welcheq/shared';

import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

const PENDING_FIELDS = {
  id: true,
  relationship: true,
  createdAt: true,
  expiresAt: true,
} as const satisfies Prisma.InvitationSelect;

export const invitationRepository = {
  create(
    db: Prisma.TransactionClient,
    data: {
      patientId: string;
      relationship: CareRelationship;
      codeHash: string;
      createdById: string;
      expiresAt: Date;
    },
  ) {
    return db.invitation.create({ data, select: PENDING_FIELDS });
  },

  listPending(patientId: string, now: Date) {
    return prisma.invitation.findMany({
      where: { patientId, acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
      select: PENDING_FIELDS,
      orderBy: { createdAt: 'desc' },
    });
  },

  findByCodeHash(codeHash: string) {
    return prisma.invitation.findUnique({
      where: { codeHash },
      select: {
        id: true,
        patientId: true,
        relationship: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
        patient: { select: { fullName: true, archivedAt: true } },
      },
    });
  },

  /** Conditional update: of two people redeeming the same code at once, only one succeeds. */
  markAccepted(db: Prisma.TransactionClient, invitationId: string, userId: string, now: Date) {
    return db.invitation.updateMany({
      where: { id: invitationId, acceptedAt: null, revokedAt: null },
      data: { acceptedAt: now, acceptedById: userId },
    });
  },

  revoke(db: Prisma.TransactionClient, patientId: string, invitationId: string, now: Date) {
    return db.invitation.updateMany({
      where: { id: invitationId, patientId, acceptedAt: null, revokedAt: null },
      data: { revokedAt: now },
    });
  },
};
