import { randomBytes } from 'node:crypto';

import { env } from '@/config/env';
import { HttpError } from './http-error';
import { logger } from './logger';

const ADMIN_TIMEOUT_MS = 10_000;
const NOT_FOUND = 404;
const ALREADY_EXISTS = [409, 422];
const UNUSABLE_PASSWORD_BYTES = 32;

interface MagicLink {
  userId: string;
  tokenHash: string;
}

async function adminRequest(path: string, init: { method: string; body?: unknown }) {
  const secretKey = env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw HttpError.conflict('This feature has not been set up yet.');
  }
  return fetch(new URL(`/auth/v1/admin/${path}`, env.SUPABASE_URL), {
    method: init.method,
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(ADMIN_TIMEOUT_MS),
  });
}

/** Server-only access to Supabase Auth, for actions a person cannot take with their own token. */
export const supabaseAdmin = {
  isConfigured: Boolean(env.SUPABASE_SECRET_KEY),

  /** Removes the sign-in itself, so the email can no longer be used to sign in. */
  async deleteAuthUser(userId: string): Promise<boolean> {
    if (!this.isConfigured) {
      logger.warn({ userId }, 'Sign-in not removed: SUPABASE_SECRET_KEY is not set');
      return false;
    }
    const response = await adminRequest(`users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    if (!response.ok && response.status !== NOT_FOUND) {
      logger.error({ userId, status: response.status }, 'Removing the sign-in failed');
      return false;
    }
    return true;
  },

  /**
   * Returns a one-time sign-in for an account, creating the account first if needed. The password
   * is random and never stored, so the only way in is a link issued here.
   */
  async issueMagicLink(email: string): Promise<MagicLink> {
    const created = await adminRequest('users', {
      method: 'POST',
      body: {
        email,
        email_confirm: true,
        password: randomBytes(UNUSABLE_PASSWORD_BYTES).toString('base64url'),
      },
    });
    if (!created.ok && !ALREADY_EXISTS.includes(created.status)) {
      logger.error({ status: created.status }, 'Creating a sign-in failed');
      throw HttpError.conflict('Sign-in is not available right now. Please try again later.');
    }

    const link = await adminRequest('generate_link', {
      method: 'POST',
      body: { type: 'magiclink', email },
    });
    if (!link.ok) {
      logger.error({ status: link.status }, 'Issuing a sign-in link failed');
      throw HttpError.conflict('Sign-in is not available right now. Please try again later.');
    }
    const body = (await link.json()) as {
      id?: string;
      user?: { id?: string };
      properties?: { hashed_token?: string };
      hashed_token?: string;
    };
    const userId = body.user?.id ?? body.id;
    const tokenHash = body.properties?.hashed_token ?? body.hashed_token;
    if (!userId || !tokenHash) {
      throw HttpError.conflict('Sign-in is not available right now. Please try again later.');
    }
    return { userId, tokenHash };
  },
};
