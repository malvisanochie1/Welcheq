import {
  ATTENDANCE_FLAG,
  SHIFT_STATUS,
  SURPRISE_CHECK_STATUS,
  type AttendanceFlag,
  type ShiftStatus,
  type SurpriseCheckStatus,
} from '@welcheq/shared';

export const SHIFT_STATUS_DETAILS: Readonly<
  Record<ShiftStatus, { label: string; containerClassName: string; textClassName: string }>
> = {
  [SHIFT_STATUS.SCHEDULED]: {
    label: 'Scheduled',
    containerClassName: 'bg-surface-muted',
    textClassName: 'text-ink-muted',
  },
  [SHIFT_STATUS.AWAITING_ARRIVAL]: {
    label: 'Not arrived yet',
    containerClassName: 'bg-warning-soft',
    textClassName: 'text-warning',
  },
  [SHIFT_STATUS.IN_PROGRESS]: {
    label: 'On visit now',
    containerClassName: 'bg-primary-soft',
    textClassName: 'text-primary',
  },
  [SHIFT_STATUS.COMPLETED]: {
    label: 'Completed',
    containerClassName: 'bg-success-soft',
    textClassName: 'text-success',
  },
  [SHIFT_STATUS.MISSED]: {
    label: 'Missed',
    containerClassName: 'bg-danger-soft',
    textClassName: 'text-danger',
  },
  [SHIFT_STATUS.CANCELLED]: {
    label: 'Cancelled',
    containerClassName: 'bg-surface-muted',
    textClassName: 'text-ink-subtle',
  },
};

export const ATTENDANCE_FLAG_LABELS: Readonly<Record<AttendanceFlag, string>> = {
  [ATTENDANCE_FLAG.LATE_ARRIVAL]: 'Arrived late',
  [ATTENDANCE_FLAG.EARLY_DEPARTURE]: 'Left early',
  [ATTENDANCE_FLAG.MOCK_LOCATION]: 'Fake location app detected',
  [ATTENDANCE_FLAG.RECORDED_OFFLINE]: 'Recorded offline',
  [ATTENDANCE_FLAG.CHECKED_OUT_AWAY]: 'Checked out away from home',
};

export const REPEAT_WEEK_CHOICES = [
  { weeks: 0, label: 'Just once' },
  { weeks: 1, label: '2 weeks' },
  { weeks: 3, label: '4 weeks' },
  { weeks: 7, label: '8 weeks' },
] as const;

export const VISIT_HISTORY_DAYS = 7;
export const VISIT_LOOKAHEAD_DAYS = 14;

/** Only outcomes worth showing to the family; a pending check stays secret. */
export const SURPRISE_CHECK_OUTCOME_LABELS: Readonly<
  Partial<Record<SurpriseCheckStatus, { label: string; isWarning: boolean }>>
> = {
  [SURPRISE_CHECK_STATUS.PASSED]: { label: 'Surprise check passed', isWarning: false },
  [SURPRISE_CHECK_STATUS.FAILED]: {
    label: 'Surprise check answered away from home',
    isWarning: true,
  },
  [SURPRISE_CHECK_STATUS.MISSED]: { label: 'Surprise check not answered', isWarning: true },
};
