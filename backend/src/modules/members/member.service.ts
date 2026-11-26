import { CARE_RELATIONSHIP, PATIENT_EDITOR_RELATIONSHIPS } from '@welcheq/shared';

import { AUDIT_ACTION, recordAuditEvent } from '@/lib/audit';
import { HttpError } from '@/lib/http-error';
import { prisma } from '@/lib/prisma';
import type { ActingUser } from '@/middleware/require-profile';
import { requirePatientAccess } from '@/modules/patients/patient-access';
import { memberRepository } from './member.repository';

export const memberService = {
  async list(user: ActingUser, patientId: string) {
    const relationship = await requirePatientAccess(user, patientId);
    const canSeeContactDetails = relationship === CARE_RELATIONSHIP.OWNER;
    const members = await memberRepository.listActive(patientId);

    return members.map((member) => ({
      userId: member.user.id,
      fullName: member.user.fullName,
      phone: canSeeContactDetails ? member.user.phone : null,
      relationship: member.relationship,
      memberSince: member.createdAt,
    }));
  },

  async remove(user: ActingUser, patientId: string, memberUserId: string) {
    await requirePatientAccess(user, patientId, PATIENT_EDITOR_RELATIONSHIPS);

    await prisma.$transaction(async (tx) => {
      const { count } = await memberRepository.revoke(tx, patientId, memberUserId, new Date());
      if (count === 0) {
        throw HttpError.notFound('This person is not on the care team');
      }
      await recordAuditEvent(tx, {
        actorId: user.id,
        action: AUDIT_ACTION.MEMBER_REMOVED,
        entityType: 'patient',
        entityId: patientId,
        metadata: { removedUserId: memberUserId },
      });
    });
  },
};
