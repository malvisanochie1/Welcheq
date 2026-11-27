import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

import { RATE_LIMITS } from '@/config/security';
import { ERROR_CODE, HttpError } from '@/lib/http-error';

const rejectWithRateLimitError = () =>
  new HttpError(429, ERROR_CODE.RATE_LIMITED, 'Too many requests. Please wait and try again');

export const globalRateLimit = rateLimit({
  ...RATE_LIMITS.GLOBAL,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) => next(rejectWithRateLimitError()),
});

export const writeRateLimit = rateLimit({
  ...RATE_LIMITS.WRITE,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => req.identity?.userId ?? ipKeyGenerator(req.ip ?? ''),
  handler: (_req, _res, next) => next(rejectWithRateLimitError()),
});

export const invitationAcceptRateLimit = rateLimit({
  ...RATE_LIMITS.INVITATION_ACCEPT,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => req.identity?.userId ?? ipKeyGenerator(req.ip ?? ''),
  handler: (_req, _res, next) => next(rejectWithRateLimitError()),
});

export const homeDisplayPairRateLimit = rateLimit({
  ...RATE_LIMITS.HOME_DISPLAY_PAIR,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) => next(rejectWithRateLimitError()),
});

export const demoSessionRateLimit = rateLimit({
  ...RATE_LIMITS.DEMO_SESSION,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) => next(rejectWithRateLimitError()),
});
