export const CALL_OUTCOME = {
  REACHED: 'REACHED',
  UNREACHABLE: 'UNREACHABLE',
} as const;

export type CallOutcome = (typeof CALL_OUTCOME)[keyof typeof CALL_OUTCOME];

export const CALL_ANSWER = {
  YES: 'YES',
  NO: 'NO',
  NOT_SURE: 'NOT_SURE',
} as const;

export type CallAnswer = (typeof CALL_ANSWER)[keyof typeof CALL_ANSWER];

export const CALL_QUESTION_KIND = {
  TASK: 'TASK',
  CAREGIVER_VISITED: 'CAREGIVER_VISITED',
} as const;

export type CallQuestionKind = (typeof CALL_QUESTION_KIND)[keyof typeof CALL_QUESTION_KIND];

export const DAILY_CALL_RULES = {
  /** Enough to cover the day without making the call feel like an interrogation. */
  MAX_TASK_QUESTIONS: 4,
  NOTE_MAX_LENGTH: 500,
} as const;
