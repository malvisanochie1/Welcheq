const MINUTE_MS = 60_000;

export const REQUEST_LIMITS = {
  JSON_BODY: '100kb',
  TIMEOUT_MS: 15_000,
} as const;

export const RATE_LIMITS = {
  GLOBAL: { windowMs: 15 * MINUTE_MS, limit: 300 },
  WRITE: { windowMs: 15 * MINUTE_MS, limit: 60 },
  INVITATION_ACCEPT: { windowMs: 15 * MINUTE_MS, limit: 10 },
  HOME_DISPLAY_PAIR: { windowMs: 15 * MINUTE_MS, limit: 5 },
} as const;

export const AUTH_TOKEN = {
  AUDIENCE: 'authenticated',
  CLOCK_TOLERANCE_SECONDS: 30,
} as const;
