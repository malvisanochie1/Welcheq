import { CARE_RELATIONSHIP } from '@welcheq/shared';

import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export const memberRepository = {
  listActive(patientId: string) {
    return prisma.patientAccess.findMany({
      where: { patientId, revokedAt: null },
      select: {
        relationship: true,
        createdAt: true,
        user: { select: { id: true, fullName: true, phone: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  revoke(db: Prisma.TransactionClient, patientId: string, userId: string, now: Date) {
    return db.patientAccess.updateMany({
      where: { patientId, userId, revokedAt: null, relationship: { not: CARE_RELATIONSHIP.OWNER } },
      data: { revokedAt: now },
    });
  },
};
