import {
  isEarlyDeparture,
  isLateArrival,
  shiftStatus,
  SURPRISE_CHECK_STATUS,
  surpriseCheckStatus,
} from '@welcheq/shared';

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
  homeCodeVerified: true,
  caregiver: { select: { id: true, fullName: true } },
  surpriseCheck: {
    select: { id: true, dueAt: true, respondedAt: true, passed: true, distanceMeters: true },
  },
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

/** A surprise check stays secret until it is due, so nobody can plan around it. */
function surpriseCheckView(visit: VisitRecord, now: Date) {
  const check = visit.surpriseCheck;
  if (!check) return null;

  const status = surpriseCheckStatus(check, visit.checkOutAt, now);
  if (status === SURPRISE_CHECK_STATUS.WAITING) {
    return { id: null, status, dueAt: null, respondedAt: null };
  }
  return { id: check.id, status, dueAt: check.dueAt, respondedAt: check.respondedAt };
}

export function toVisitResponse(visit: VisitRecord, now = new Date()) {
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
    homeCodeVerified: visit.homeCodeVerified,
    surpriseCheck: surpriseCheckView(visit, now),
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
    visit: visit ? toVisitResponse(visit, now) : null,
  };
}
