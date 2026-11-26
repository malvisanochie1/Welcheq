export const CARE_TASK_CATEGORY = {
  MEDICATION: 'MEDICATION',
  VITALS: 'VITALS',
  PERSONAL_CARE: 'PERSONAL_CARE',
  MEAL: 'MEAL',
  MOBILITY: 'MOBILITY',
  OTHER: 'OTHER',
} as const;

export type CareTaskCategory = (typeof CARE_TASK_CATEGORY)[keyof typeof CARE_TASK_CATEGORY];

export const CARE_TASK_CATEGORIES = Object.values(CARE_TASK_CATEGORY);

export const TASK_OUTCOME = {
  DONE: 'DONE',
  NOT_DONE: 'NOT_DONE',
} as const;

export type TaskOutcome = (typeof TASK_OUTCOME)[keyof typeof TASK_OUTCOME];

export const TASK_OUTCOMES = Object.values(TASK_OUTCOME);

export const CHECKLIST_STATUS = {
  ...TASK_OUTCOME,
  UPCOMING: 'UPCOMING',
  DUE: 'DUE',
  MISSED: 'MISSED',
} as const;

export type ChecklistStatus = (typeof CHECKLIST_STATUS)[keyof typeof CHECKLIST_STATUS];

export const CARE_PLAN_RULES = {
  MAX_TASKS: 40,
  TITLE_MAX_LENGTH: 80,
  INSTRUCTIONS_MAX_LENGTH: 500,
  /** A task becomes "due" this long before its time, and "missed" this long after it. */
  DUE_WINDOW_MINUTES: 60,
  GRACE_MINUTES: 90,
  /** How far back a caregiver may still record a task, e.g. after an offline visit. */
  RECORDABLE_PAST_DAYS: 1,
} as const;

export const MINUTES_PER_DAY = 24 * 60;

export const DEFAULT_PATIENT_TIME_ZONE = 'Africa/Lagos';
