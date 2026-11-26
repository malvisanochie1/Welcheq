import type { Prisma } from '@/generated/prisma/client';

export const READING_FIELDS = {
  id: true,
  type: true,
  value: true,
  secondaryValue: true,
  unit: true,
  measuredAt: true,
  source: true,
  visitId: true,
  recordedBy: { select: { fullName: true } },
} as const satisfies Prisma.HealthReadingSelect;

export type ReadingRecord = Prisma.HealthReadingGetPayload<{ select: typeof READING_FIELDS }>;

export function toReadingResponse(reading: ReadingRecord) {
  return {
    id: reading.id,
    type: reading.type,
    value: reading.value,
    secondaryValue: reading.secondaryValue,
    unit: reading.unit,
    measuredAt: reading.measuredAt,
    source: reading.source,
    visitId: reading.visitId,
    recordedBy: reading.recordedBy.fullName,
  };
}
