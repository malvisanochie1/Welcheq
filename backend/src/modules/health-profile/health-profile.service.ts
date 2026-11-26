import {
  HEALTH_PROFILE_LIMITS,
  PATIENT_EDITOR_RELATIONSHIPS,
  type AllergyData,
  type ConditionData,
  type MedicationData,
} from '@welcheq/shared';

import { AUDIT_ACTION, recordAuditEvent } from '@/lib/audit';
import { HttpError } from '@/lib/http-error';
import { prisma } from '@/lib/prisma';
import type { ActingUser } from '@/middleware/require-profile';
import { requirePatientAccess } from '@/modules/patients/patient-access';

const AUTHOR = { select: { fullName: true } } as const;

const MEDICATION_FIELDS = {
  id: true,
  name: true,
  dose: true,
  instructions: true,
  stoppedAt: true,
  updatedAt: true,
} as const;
const ALLERGY_FIELDS = {
  id: true,
  substance: true,
  reaction: true,
  severity: true,
  updatedAt: true,
} as const;
const CONDITION_FIELDS = {
  id: true,
  name: true,
  notes: true,
  diagnosedOn: true,
  updatedAt: true,
} as const;

const toDate = (isoDate: string | null | undefined) =>
  isoDate ? new Date(`${isoDate}T00:00:00Z`) : isoDate;

function toConditionResponse<T extends { diagnosedOn: Date | null }>(condition: T) {
  return { ...condition, diagnosedOn: condition.diagnosedOn?.toISOString().slice(0, 10) ?? null };
}

async function requireEditor(user: ActingUser, patientId: string) {
  await requirePatientAccess(user, patientId, PATIENT_EDITOR_RELATIONSHIPS);
}

function assertBelowLimit(count: number, limit: number) {
  if (count >= limit) {
    throw HttpError.conflict('This list is full. Remove an entry first.');
  }
}

export const healthProfileService = {
  async profile(user: ActingUser, patientId: string) {
    await requirePatientAccess(user, patientId);
    const [medications, allergies, conditions] = await Promise.all([
      prisma.medication.findMany({
        where: { patientId },
        select: { ...MEDICATION_FIELDS, createdBy: AUTHOR },
        orderBy: [{ stoppedAt: { sort: 'desc', nulls: 'first' } }, { name: 'asc' }],
      }),
      prisma.allergy.findMany({
        where: { patientId },
        select: ALLERGY_FIELDS,
        orderBy: [{ severity: 'desc' }, { substance: 'asc' }],
      }),
      prisma.condition.findMany({
        where: { patientId },
        select: CONDITION_FIELDS,
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      medications: medications.map(({ createdBy, ...medication }) => ({
        ...medication,
        addedBy: createdBy.fullName,
      })),
      allergies,
      conditions: conditions.map(toConditionResponse),
    };
  },

  async addMedication(user: ActingUser, patientId: string, input: MedicationData) {
    await requireEditor(user, patientId);
    const active = await prisma.medication.count({ where: { patientId, stoppedAt: null } });
    assertBelowLimit(active, HEALTH_PROFILE_LIMITS.MAX_ACTIVE_MEDICATIONS);
    return prisma.medication.create({
      data: { ...input, patientId, createdById: user.id },
      select: MEDICATION_FIELDS,
    });
  },

  async updateMedication(
    user: ActingUser,
    patientId: string,
    medicationId: string,
    input: MedicationData,
  ) {
    await requireEditor(user, patientId);
    return updateOrNotFound(() =>
      prisma.medication.update({
        where: { id: medicationId, patientId },
        data: input,
        select: MEDICATION_FIELDS,
      }),
    );
  },

  async stopMedication(user: ActingUser, patientId: string, medicationId: string) {
    await requireEditor(user, patientId);
    const { count } = await prisma.medication.updateMany({
      where: { id: medicationId, patientId, stoppedAt: null },
      data: { stoppedAt: new Date() },
    });
    if (count === 0) {
      throw HttpError.notFound('Current medicine not found');
    }
  },

  async addAllergy(user: ActingUser, patientId: string, input: AllergyData) {
    await requireEditor(user, patientId);
    assertBelowLimit(
      await prisma.allergy.count({ where: { patientId } }),
      HEALTH_PROFILE_LIMITS.MAX_ALLERGIES,
    );
    return prisma.allergy.create({
      data: { ...input, patientId, createdById: user.id },
      select: ALLERGY_FIELDS,
    });
  },

  async updateAllergy(user: ActingUser, patientId: string, allergyId: string, input: AllergyData) {
    await requireEditor(user, patientId);
    return updateOrNotFound(() =>
      prisma.allergy.update({
        where: { id: allergyId, patientId },
        data: input,
        select: ALLERGY_FIELDS,
      }),
    );
  },

  async removeAllergy(user: ActingUser, patientId: string, allergyId: string) {
    await requireEditor(user, patientId);
    await removeWithAudit(user, 'allergy', allergyId, (tx) =>
      tx.allergy.deleteMany({ where: { id: allergyId, patientId } }),
    );
  },

  async addCondition(user: ActingUser, patientId: string, input: ConditionData) {
    await requireEditor(user, patientId);
    assertBelowLimit(
      await prisma.condition.count({ where: { patientId } }),
      HEALTH_PROFILE_LIMITS.MAX_CONDITIONS,
    );
    const condition = await prisma.condition.create({
      data: {
        ...input,
        diagnosedOn: toDate(input.diagnosedOn),
        patientId,
        createdById: user.id,
      },
      select: CONDITION_FIELDS,
    });
    return toConditionResponse(condition);
  },

  async updateCondition(
    user: ActingUser,
    patientId: string,
    conditionId: string,
    input: ConditionData,
  ) {
    await requireEditor(user, patientId);
    const condition = await updateOrNotFound(() =>
      prisma.condition.update({
        where: { id: conditionId, patientId },
        data: { ...input, diagnosedOn: toDate(input.diagnosedOn) },
        select: CONDITION_FIELDS,
      }),
    );
    return toConditionResponse(condition);
  },

  async removeCondition(user: ActingUser, patientId: string, conditionId: string) {
    await requireEditor(user, patientId);
    await removeWithAudit(user, 'condition', conditionId, (tx) =>
      tx.condition.deleteMany({ where: { id: conditionId, patientId } }),
    );
  },
};

const RECORD_NOT_FOUND = 'P2025';

async function updateOrNotFound<T>(update: () => Promise<T>): Promise<T> {
  try {
    return await update();
  } catch (error) {
    if ((error as { code?: string }).code === RECORD_NOT_FOUND) {
      throw HttpError.notFound('Entry not found');
    }
    throw error;
  }
}

type Transaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function removeWithAudit(
  user: ActingUser,
  entityType: string,
  entityId: string,
  remove: (tx: Transaction) => Promise<{ count: number }>,
) {
  await prisma.$transaction(async (tx) => {
    const { count } = await remove(tx);
    if (count === 0) {
      throw HttpError.notFound('Entry not found');
    }
    await recordAuditEvent(tx, {
      actorId: user.id,
      action: AUDIT_ACTION.HEALTH_PROFILE_ENTRY_REMOVED,
      entityType,
      entityId,
    });
  });
}
