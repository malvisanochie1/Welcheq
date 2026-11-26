import {
  CARE_RELATIONSHIP,
  FAMILY_RELATIONSHIPS,
  READING_SOURCE,
  READING_SPECS,
  REPORT_RULES,
  TASK_RECORDER_RELATIONSHIPS,
  zonedDateTimeToInstant,
  addDays,
  type ReadingInput,
  type visitReportSchema,
} from '@welcheq/shared';
import type { z } from 'zod';

import type { Prisma } from '@/generated/prisma/client';
import { AUDIT_ACTION, recordAuditEvent } from '@/lib/audit';
import { HttpError } from '@/lib/http-error';
import { prisma } from '@/lib/prisma';
import type { ActingUser } from '@/middleware/require-profile';
import { requirePatientAccess } from '@/modules/patients/patient-access';
import { READING_FIELDS, toReadingResponse } from './health-record.mapper';

type VisitReportData = z.output<typeof visitReportSchema>;

const HOUR_MS = 3_600_000;
const CLOCK_SKEW_MS = 5 * 60_000;
const MANUAL_READING_MAX_AGE_HOURS = 7 * 24;

/** Readings cannot be dated in the future or earlier than the moment they could have been taken. */
function resolveMeasuredAt(reading: ReadingInput, earliest: Date, now: Date): Date {
  if (!reading.measuredAt) return now;
  const measuredAt = new Date(reading.measuredAt);
  if (measuredAt.getTime() > now.getTime() + CLOCK_SKEW_MS || measuredAt < earliest) {
    throw HttpError.invalid('Check the time this reading was taken.');
  }
  return measuredAt;
}

function toReadingRows(
  readings: ReadingInput[],
  base: Omit<
    Prisma.HealthReadingCreateManyInput,
    'type' | 'value' | 'secondaryValue' | 'unit' | 'measuredAt'
  >,
  earliest: Date,
  now: Date,
): Prisma.HealthReadingCreateManyInput[] {
  return readings.map((reading) => ({
    ...base,
    type: reading.type,
    value: reading.value,
    secondaryValue: reading.secondaryValue ?? null,
    unit: READING_SPECS[reading.type].unit,
    measuredAt: resolveMeasuredAt(reading, earliest, now),
  }));
}

const REPORT_FIELDS = {
  wellbeing: true,
  notes: true,
  updatedAt: true,
  author: { select: { fullName: true } },
} as const;

export const healthRecordService = {
  async saveVisitReport(
    user: ActingUser,
    patientId: string,
    visitId: string,
    input: VisitReportData,
  ) {
    await requirePatientAccess(user, patientId, [CARE_RELATIONSHIP.CAREGIVER]);

    const visit = await prisma.visit.findFirst({
      where: { id: visitId, patientId, caregiverId: user.id },
      select: { checkInAt: true, checkOutAt: true },
    });
    if (!visit) {
      throw HttpError.notFound('Visit not found');
    }

    const now = new Date();
    const editableUntil = visit.checkOutAt
      ? visit.checkOutAt.getTime() + REPORT_RULES.EDITABLE_AFTER_VISIT_HOURS * HOUR_MS
      : Number.POSITIVE_INFINITY;
    if (now.getTime() > editableUntil) {
      throw HttpError.conflict('This visit report can no longer be changed.');
    }

    const readingRows = toReadingRows(
      input.readings,
      { patientId, source: READING_SOURCE.CAREGIVER, recordedById: user.id, visitId },
      visit.checkInAt,
      now,
    );

    await prisma.$transaction(async (tx) => {
      const previous = await tx.visitReport.findUnique({
        where: { visitId },
        select: { wellbeing: true, notes: true },
      });
      await tx.visitReport.upsert({
        where: { visitId },
        create: {
          visitId,
          patientId,
          authorId: user.id,
          wellbeing: input.wellbeing,
          notes: input.notes || null,
        },
        update: { wellbeing: input.wellbeing, notes: input.notes || null },
      });
      if (readingRows.length > 0) {
        await tx.healthReading.createMany({ data: readingRows });
      }
      if (previous) {
        await recordAuditEvent(tx, {
          actorId: user.id,
          action: AUDIT_ACTION.VISIT_REPORT_CHANGED,
          entityType: 'visit',
          entityId: visitId,
          metadata: { previous },
        });
      }
    });

    return this.visitReport(user, patientId, visitId);
  },

  async visitReport(user: ActingUser, patientId: string, visitId: string) {
    await requirePatientAccess(user, patientId);
    const visit = await prisma.visit.findFirst({
      where: { id: visitId, patientId },
      select: {
        report: { select: REPORT_FIELDS },
        readings: { select: READING_FIELDS, orderBy: { measuredAt: 'asc' } },
      },
    });
    if (!visit) {
      throw HttpError.notFound('Visit not found');
    }

    return {
      report: visit.report
        ? {
            wellbeing: visit.report.wellbeing,
            notes: visit.report.notes,
            updatedAt: visit.report.updatedAt,
            author: visit.report.author.fullName,
          }
        : null,
      readings: visit.readings.map(toReadingResponse),
    };
  },

  async addReading(user: ActingUser, patientId: string, reading: ReadingInput) {
    const relationship = await requirePatientAccess(user, patientId, [
      ...FAMILY_RELATIONSHIPS,
      ...TASK_RECORDER_RELATIONSHIPS,
    ]);
    const now = new Date();
    const source =
      relationship === CARE_RELATIONSHIP.CAREGIVER
        ? READING_SOURCE.CAREGIVER
        : READING_SOURCE.FAMILY;
    const earliest = new Date(now.getTime() - MANUAL_READING_MAX_AGE_HOURS * HOUR_MS);
    const [row] = toReadingRows(
      [reading],
      { patientId, source, recordedById: user.id },
      earliest,
      now,
    );
    if (!row) {
      throw HttpError.invalid('Enter a reading');
    }

    const created = await prisma.healthReading.create({ data: row, select: READING_FIELDS });
    return toReadingResponse(created);
  },

  async listReadings(
    user: ActingUser,
    patientId: string,
    query: { type?: ReadingInput['type']; from: string; to: string },
  ) {
    await requirePatientAccess(user, patientId);
    const { timeZone } = await prisma.patient.findUniqueOrThrow({
      where: { id: patientId },
      select: { timeZone: true },
    });
    const readings = await prisma.healthReading.findMany({
      where: {
        patientId,
        ...(query.type ? { type: query.type } : {}),
        measuredAt: {
          gte: zonedDateTimeToInstant(query.from, 0, timeZone),
          lt: zonedDateTimeToInstant(addDays(query.to, 1), 0, timeZone),
        },
      },
      select: READING_FIELDS,
      orderBy: { measuredAt: 'desc' },
    });
    return readings.map(toReadingResponse);
  },
};
