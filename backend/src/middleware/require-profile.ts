import type { UserRole } from '@welcheq/shared';
import type { RequestHandler } from 'express';

import { ERROR_CODE, HttpError } from '@/lib/http-error';
import { prisma } from '@/lib/prisma';
import { requireIdentity } from './authenticate';

export interface ActingUser {
  id: string;
  role: UserRole;
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
    select: { id: true, role: true },
  });

  if (!user) {
    return next(
      new HttpError(403, ERROR_CODE.FORBIDDEN, 'Finish setting up your profile to continue'),
    );
  }

  req.actingUser = user;
  return next();
};

export function requireActingUser(actingUser: ActingUser | undefined): ActingUser {
  if (!actingUser) {
    throw HttpError.unauthenticated();
  }
  return actingUser;
}
