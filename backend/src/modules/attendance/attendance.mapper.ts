import { isEarlyDeparture, isLateArrival, shiftStatus } from '@welcheq/shared';

import type { Prisma } from '@/generated/prisma/client';

export const VISIT_FIELDS = {
  id: true,
  patientId: true,
  shiftId: true,
  checkInAt: true,
  checkOutAt: true,
  checkInDistanceMeters: true,
  checkOutDistanceMeters: true,
  flags: true,
  caregiver: { select: { id: true, fullName: true } },
} as const satisfies Prisma.VisitSelect;

export type VisitRecord = Prisma.VisitGetPayload<{ select: typeof VISIT_FIELDS }>;

export const SHIFT_FIELDS = {
  id: true,
  patientId: true,
  seriesId: true,
  startsAt: true,
  endsAt: true,
  cancelledAt: true,
  caregiver: { select: { id: true, fullName: true } },
  patient: { select: { fullName: true } },
  visits: { select: VISIT_FIELDS, orderBy: { checkInAt: 'asc' }, take: 1 },
} as const satisfies Prisma.ShiftSelect;

export type ShiftRecord = Prisma.ShiftGetPayload<{ select: typeof SHIFT_FIELDS }>;

const roundMeters = (meters: number | null) => (meters === null ? null : Math.round(meters));

export function toVisitResponse(visit: VisitRecord) {
  return {
    id: visit.id,
    patientId: visit.patientId,
    shiftId: visit.shiftId,
    caregiver: visit.caregiver,
    checkInAt: visit.checkInAt,
    checkOutAt: visit.checkOutAt,
    checkInDistanceMeters: roundMeters(visit.checkInDistanceMeters),
    checkOutDistanceMeters: roundMeters(visit.checkOutDistanceMeters),
    flags: visit.flags,
    isOpen: visit.checkOutAt === null,
  };
}

export function toShiftResponse(shift: ShiftRecord, now: Date) {
  const visit = shift.visits[0] ?? null;
  return {
    id: shift.id,
    patientId: shift.patientId,
    patientName: shift.patient.fullName,
    seriesId: shift.seriesId,
    caregiver: shift.caregiver,
    startsAt: shift.startsAt,
    endsAt: shift.endsAt,
    status: shiftStatus(shift, visit, now),
    isLate: visit ? isLateArrival(shift, visit) : false,
    isEarlyDeparture: visit ? isEarlyDeparture(shift, visit) : false,
    visit: visit ? toVisitResponse(visit) : null,
  };
}
