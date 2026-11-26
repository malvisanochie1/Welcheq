import { ATTENDANCE_RULES, SHIFT_STATUS, type ShiftStatus } from '../constants/attendance';

const MINUTE_MS = 60_000;

export interface ShiftTiming {
  startsAt: Date;
  endsAt: Date;
  cancelledAt: Date | null;
}

export interface VisitTiming {
  checkInAt: Date;
  checkOutAt: Date | null;
}

export function shiftStatus(shift: ShiftTiming, visit: VisitTiming | null, now: Date): ShiftStatus {
  if (shift.cancelledAt) return SHIFT_STATUS.CANCELLED;
  if (visit) return visit.checkOutAt ? SHIFT_STATUS.COMPLETED : SHIFT_STATUS.IN_PROGRESS;

  const missedAt = shift.startsAt.getTime() + ATTENDANCE_RULES.MISSED_AFTER_MINUTES * MINUTE_MS;
  if (now.getTime() >= missedAt) return SHIFT_STATUS.MISSED;
  if (now >= shift.startsAt) return SHIFT_STATUS.AWAITING_ARRIVAL;
  return SHIFT_STATUS.SCHEDULED;
}

export function minutesLate(shift: ShiftTiming, visit: VisitTiming): number {
  return Math.max(
    0,
    Math.round((visit.checkInAt.getTime() - shift.startsAt.getTime()) / MINUTE_MS),
  );
}

export function isLateArrival(shift: ShiftTiming, visit: VisitTiming): boolean {
  return minutesLate(shift, visit) > ATTENDANCE_RULES.LATE_AFTER_MINUTES;
}

export function isEarlyDeparture(shift: ShiftTiming, visit: VisitTiming): boolean {
  if (!visit.checkOutAt) return false;
  const leftEarlyBy = (shift.endsAt.getTime() - visit.checkOutAt.getTime()) / MINUTE_MS;
  return leftEarlyBy > ATTENDANCE_RULES.EARLY_DEPARTURE_MINUTES;
}

/** A check-in can attach to a shift from shortly before it starts until it ends. */
export function isWithinCheckInWindow(shift: ShiftTiming, at: Date): boolean {
  const opensAt = shift.startsAt.getTime() - ATTENDANCE_RULES.EARLY_CHECK_IN_MINUTES * MINUTE_MS;
  return !shift.cancelledAt && at.getTime() >= opensAt && at < shift.endsAt;
}

export function shiftsOverlap(first: ShiftTiming, second: ShiftTiming): boolean {
  return first.startsAt < second.endsAt && second.startsAt < first.endsAt;
}
