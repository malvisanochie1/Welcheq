import type { UserRole } from '@welcheq/shared';
import type { RequestHandler } from 'express';

import { ERROR_CODE, HttpError } from '@/lib/http-error';
import { DEMO_READ_ONLY_MESSAGE } from '@/modules/demo/demo.constants';
import { prisma } from '@/lib/prisma';
import { requireIdentity } from './authenticate';

export interface ActingUser {
  id: string;
  role: UserRole;
}

export const ACCOUNT_DELETED_MESSAGE = 'This account has been deleted.';

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
/** Writes a demo visitor may still make, because they change nothing anyone else sees. */
const DEMO_ALLOWED_WRITES = new Set(['/v1/notifications/read']);

export function isBlockedDemoWrite(method: string, path: string): boolean {
  return !READ_METHODS.has(method) && !DEMO_ALLOWED_WRITES.has(path);
}

declare module 'express-serve-static-core' {
  interface Request {
    actingUser?: ActingUser;
  }
}

/** Loads the caller's role from the database: roles in tokens are never trusted. */
export const requireProfile: RequestHandler = async (req, _res, next) => {
  const identity = requireIdentity(req.identity);
  const user = await prisma.user.findUnique({
    where: { id: identity.userId },
    select: { id: true, role: true, deletedAt: true, isDemo: true },
  });

  if (!user) {
    return next(
      new HttpError(403, ERROR_CODE.FORBIDDEN, 'Finish setting up your profile to continue'),
    );
  }
  if (user.deletedAt) {
    return next(HttpError.forbidden(ACCOUNT_DELETED_MESSAGE));
  }

  if (user.isDemo && isBlockedDemoWrite(req.method, req.originalUrl.split('?')[0] ?? '')) {
    return next(HttpError.forbidden(DEMO_READ_ONLY_MESSAGE));
  }

  req.actingUser = { id: user.id, role: user.role };
  return next();
};

export function requireActingUser(actingUser: ActingUser | undefined): ActingUser {
  if (!actingUser) {
    throw HttpError.unauthenticated();
  }
  return actingUser;
}
