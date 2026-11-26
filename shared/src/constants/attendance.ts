export const SHIFT_STATUS = {
  SCHEDULED: 'SCHEDULED',
  AWAITING_ARRIVAL: 'AWAITING_ARRIVAL',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  MISSED: 'MISSED',
  CANCELLED: 'CANCELLED',
} as const;

export type ShiftStatus = (typeof SHIFT_STATUS)[keyof typeof SHIFT_STATUS];

export const ATTENDANCE_FLAG = {
  LATE_ARRIVAL: 'LATE_ARRIVAL',
  EARLY_DEPARTURE: 'EARLY_DEPARTURE',
  MOCK_LOCATION: 'MOCK_LOCATION',
  RECORDED_OFFLINE: 'RECORDED_OFFLINE',
  CHECKED_OUT_AWAY: 'CHECKED_OUT_AWAY',
} as const;

export type AttendanceFlag = (typeof ATTENDANCE_FLAG)[keyof typeof ATTENDANCE_FLAG];

export const ATTENDANCE_RULES = {
  /** Check-in opens this long before a shift starts. */
  EARLY_CHECK_IN_MINUTES: 60,
  LATE_AFTER_MINUTES: 15,
  /** With no check-in this long after the start, the visit counts as missed. */
  MISSED_AFTER_MINUTES: 60,
  EARLY_DEPARTURE_MINUTES: 15,
  MIN_SHIFT_MINUTES: 30,
  MAX_SHIFT_MINUTES: 16 * 60,
  MAX_REPEAT_WEEKS: 8,
  MAX_SCHEDULE_RANGE_DAYS: 62,
} as const;
