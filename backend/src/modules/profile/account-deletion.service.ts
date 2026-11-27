import { CARE_RELATIONSHIP } from '@welcheq/shared';

import { AUDIT_ACTION, recordAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { supabasePhotoStorage } from '@/lib/photo-storage/supabase-photo-storage';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const DELETED_USER_NAME = 'Deleted user';
const deletedEmail = (userId: string) => `deleted-${userId}@welcheq.invalid`;

async function photosOf(patientIds: string[]): Promise<string[]> {
  if (patientIds.length === 0) return [];
  const [visits, documents] = await Promise.all([
    prisma.visit.findMany({
      where: { patientId: { in: patientIds }, selfiePath: { not: null } },
      select: { selfiePath: true },
    }),
    prisma.healthDocument.findMany({
      where: { patientId: { in: patientIds } },
      select: { storagePath: true },
    }),
  ]);
  return [
    ...visits.flatMap(({ selfiePath }) => (selfiePath ? [selfiePath] : [])),
    ...documents.map(({ storagePath }) => storagePath),
  ];
}

/**
 * Deletes everything the person owns and clears their personal details. Records they made for
 * other families, such as visits as a caregiver, stay in those families' history under
 * "Deleted user", because the care happened and the family relies on that history.
 */
export async function deleteAccount(userId: string) {
  const owned = await prisma.patientAccess.findMany({
    where: { userId, relationship: CARE_RELATIONSHIP.OWNER },
    select: { patientId: true },
  });
  const ownedPatientIds = owned.map(({ patientId }) => patientId);
  const photoPaths = await photosOf(ownedPatientIds);

  await prisma.$transaction(async (tx) => {
    await tx.patient.deleteMany({ where: { id: { in: ownedPatientIds } } });
    await tx.patientAccess.deleteMany({ where: { userId } });
    await tx.organizationMember.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.invitation.deleteMany({ where: { createdById: userId, acceptedAt: null } });
    await tx.user.update({
      where: { id: userId },
      data: {
        fullName: DELETED_USER_NAME,
        email: deletedEmail(userId),
        phone: null,
        deletedAt: new Date(),
      },
    });
    await recordAuditEvent(tx, {
      actorId: userId,
      action: AUDIT_ACTION.ACCOUNT_DELETED,
      entityType: 'user',
      entityId: userId,
      metadata: { patientsDeleted: ownedPatientIds.length },
    });
  });

  for (const path of photoPaths) {
    await supabasePhotoStorage
      .remove(path)
      .catch((error: unknown) => logger.error({ err: error }, 'Removing a photo failed'));
  }
  await supabaseAdmin.deleteAuthUser(userId);
}
