import { FAMILY_RELATIONSHIPS } from '@welcheq/shared';

import { AUDIT_ACTION, recordAuditEvent } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import type { ActingUser } from '@/middleware/require-profile';
import { requirePatientAccess } from '@/modules/patients/patient-access';
import { toFhirBundle } from './fhir.mapper';

const READINGS_INCLUDED = 500;

export const fhirService = {
  async exportRecord(user: ActingUser, patientId: string) {
    await requirePatientAccess(user, patientId, FAMILY_RELATIONSHIPS);

    const [patient, allergies, medications, conditions, readings] = await Promise.all([
      prisma.patient.findUniqueOrThrow({
        where: { id: patientId },
        select: { id: true, fullName: true, dateOfBirth: true, homeAddress: true, phone: true },
      }),
      prisma.allergy.findMany({
        where: { patientId },
        select: { id: true, substance: true, reaction: true, severity: true },
      }),
      prisma.medication.findMany({
        where: { patientId },
        select: {
          id: true,
          name: true,
          dose: true,
          instructions: true,
          stoppedAt: true,
          createdAt: true,
        },
      }),
      prisma.condition.findMany({
        where: { patientId },
        select: { id: true, name: true, notes: true, diagnosedOn: true },
      }),
      prisma.healthReading.findMany({
        where: { patientId },
        select: { id: true, type: true, value: true, secondaryValue: true, measuredAt: true },
        orderBy: { measuredAt: 'desc' },
        take: READINGS_INCLUDED,
      }),
    ]);

    await recordAuditEvent(prisma, {
      actorId: user.id,
      action: AUDIT_ACTION.HEALTH_RECORD_EXPORTED,
      entityType: 'patient',
      entityId: patientId,
    });

    return toFhirBundle({ patient, allergies, medications, conditions, readings }, new Date());
  },
};
