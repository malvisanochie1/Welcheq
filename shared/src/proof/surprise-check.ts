const MINUTE_MS = 60_000;

export const SURPRISE_CHECK_RULES = {
  EARLIEST_AFTER_CHECK_IN_MINUTES: 30,
  LATEST_BEFORE_END_MINUTES: 20,
  DEFAULT_WINDOW_MINUTES: 180,
  RESPONSE_WINDOW_MINUTES: 30,
} as const;

export const SURPRISE_CHECK_STATUS = {
  WAITING: 'WAITING',
  DUE: 'DUE',
  PASSED: 'PASSED',
  FAILED: 'FAILED',
  MISSED: 'MISSED',
  NOT_REACHED: 'NOT_REACHED',
} as const;

export type SurpriseCheckStatus =
  (typeof SURPRISE_CHECK_STATUS)[keyof typeof SURPRISE_CHECK_STATUS];

/**
 * Picks a random moment between 30 minutes after check-in and 20 minutes before the planned
 * end (or within three hours when there is no planned end). `random` is in [0, 1).
 */
export function pickSurpriseCheckTime(
  checkInAt: Date,
  plannedEnd: Date | null,
  random: number,
): Date {
  const earliest =
    checkInAt.getTime() + SURPRISE_CHECK_RULES.EARLIEST_AFTER_CHECK_IN_MINUTES * MINUTE_MS;
  const latest = plannedEnd
    ? plannedEnd.getTime() - SURPRISE_CHECK_RULES.LATEST_BEFORE_END_MINUTES * MINUTE_MS
    : earliest + SURPRISE_CHECK_RULES.DEFAULT_WINDOW_MINUTES * MINUTE_MS;
  const span = Math.max(0, latest - earliest);
  return new Date(earliest + Math.floor(random * span));
}

export interface SurpriseCheckState {
  dueAt: Date;
  respondedAt: Date | null;
  passed: boolean | null;
}

export function surpriseCheckStatus(
  check: SurpriseCheckState,
  visitCheckOutAt: Date | null,
  now: Date,
): SurpriseCheckStatus {
  if (check.respondedAt) {
    return check.passed ? SURPRISE_CHECK_STATUS.PASSED : SURPRISE_CHECK_STATUS.FAILED;
  }
  const closesAt = check.dueAt.getTime() + SURPRISE_CHECK_RULES.RESPONSE_WINDOW_MINUTES * MINUTE_MS;
  if (visitCheckOutAt && visitCheckOutAt < check.dueAt) return SURPRISE_CHECK_STATUS.NOT_REACHED;
  if (now.getTime() >= closesAt || (visitCheckOutAt && visitCheckOutAt >= check.dueAt)) {
    return SURPRISE_CHECK_STATUS.MISSED;
  }
  if (now >= check.dueAt) return SURPRISE_CHECK_STATUS.DUE;
  return SURPRISE_CHECK_STATUS.WAITING;
}
