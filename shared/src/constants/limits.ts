export const TEXT_LIMIT = {
  NAME: 120,
  EMAIL: 254,
  PHONE: 20,
  ADDRESS: 300,
  SHORT_NOTE: 500,
  LONG_NOTE: 4000,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const SESSION = {
  INACTIVITY_LOCK_MINUTES: 5,
} as const;
