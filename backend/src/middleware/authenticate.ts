import type { RequestHandler } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import { env } from '@/config/env';
import { AUTH_TOKEN } from '@/config/security';
import { HttpError } from '@/lib/http-error';

export interface AuthIdentity {
  userId: string;
  email: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    identity?: AuthIdentity;
  }
}

const issuer = new URL('/auth/v1', env.SUPABASE_URL).toString();
const signingKeys = createRemoteJWKSet(new URL('/auth/v1/.well-known/jwks.json', env.SUPABASE_URL));

const BEARER_PREFIX = 'Bearer ';

export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith(BEARER_PREFIX)) {
    return next(HttpError.unauthenticated());
  }

  try {
    const { payload } = await jwtVerify(header.slice(BEARER_PREFIX.length), signingKeys, {
      issuer,
      audience: AUTH_TOKEN.AUDIENCE,
      clockTolerance: AUTH_TOKEN.CLOCK_TOLERANCE_SECONDS,
    });

    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
      return next(HttpError.unauthenticated());
    }

    req.identity = { userId: payload.sub, email: payload.email };
    return next();
  } catch {
    return next(HttpError.unauthenticated('Your session has expired. Please sign in again'));
  }
};

export function requireIdentity(identity: AuthIdentity | undefined): AuthIdentity {
  if (!identity) {
    throw HttpError.unauthenticated();
  }
  return identity;
}
