import { env } from '@/config/env';
import { logger } from './logger';

const ADMIN_TIMEOUT_MS = 10_000;
const NOT_FOUND = 404;

/** Server-only access to Supabase Auth, for actions a person cannot take with their own token. */
export const supabaseAdmin = {
  isConfigured: Boolean(env.SUPABASE_SECRET_KEY),

  /** Removes the sign-in itself, so the email can no longer be used to sign in. */
  async deleteAuthUser(userId: string): Promise<boolean> {
    const secretKey = env.SUPABASE_SECRET_KEY;
    if (!secretKey) {
      logger.warn({ userId }, 'Sign-in not removed: SUPABASE_SECRET_KEY is not set');
      return false;
    }

    const response = await fetch(
      new URL(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, env.SUPABASE_URL),
      {
        method: 'DELETE',
        headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}` },
        signal: AbortSignal.timeout(ADMIN_TIMEOUT_MS),
      },
    );
    if (!response.ok && response.status !== NOT_FOUND) {
      logger.error({ userId, status: response.status }, 'Removing the sign-in failed');
      return false;
    }
    return true;
  },
};
