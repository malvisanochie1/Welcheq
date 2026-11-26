import type { SignInInput, SignUpInput } from '@welcheq/shared';

import { publicEnv } from '@/config/env';
import { EMAIL_CONFIRMED_PATH } from '@/config/navigation';
import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

const GENERIC_SIGN_IN_ERROR = 'Email or password is incorrect.';
const GENERIC_FAILURE = 'Something went wrong. Please try again.';

/** Supabase error codes worth explaining; anything else gets a safe, general message. */
const AUTH_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  email_not_confirmed: 'Confirm your email first, using the link we sent you.',
  over_request_rate_limit: 'Too many attempts. Please wait a minute and try again.',
  over_email_send_rate_limit: 'Too many emails sent. Please wait a few minutes and try again.',
  user_already_exists: 'An account with this email already exists. Sign in instead.',
  email_exists: 'An account with this email already exists. Sign in instead.',
  weak_password: 'Choose a stronger password.',
};

function messageFor(error: { code?: string; status?: number }, fallback: string): string {
  return (error.code && AUTH_ERROR_MESSAGES[error.code]) || fallback;
}

export class AuthError extends Error {
  override name = 'AuthError';
}

export async function signInWithPassword(input: SignInInput): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword(input);
  if (error) {
    throw new AuthError(messageFor(error, GENERIC_SIGN_IN_ERROR));
  }
}

export async function verifyCurrentPassword(password: string): Promise<SignInInput> {
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!email) {
    throw new AuthError('Please sign in again.');
  }

  const credentials = { email, password };
  await signInWithPassword(credentials).catch(() => {
    throw new AuthError('That password is not correct.');
  });
  return credentials;
}

export type SignUpOutcome = 'signed-in' | 'confirm-email';

export async function signUpWithPassword(input: SignUpInput): Promise<SignUpOutcome> {
  const { data, error } = await supabase.auth.signUp({
    ...input,
    options: { emailRedirectTo: `${publicEnv.webUrl}${EMAIL_CONFIRMED_PATH}` },
  });
  if (error) {
    throw new AuthError(messageFor(error, GENERIC_FAILURE));
  }
  if (!data.session && data.user?.identities?.length === 0) {
    throw new AuthError(AUTH_ERROR_MESSAGES.user_already_exists ?? GENERIC_FAILURE);
  }
  return data.session ? 'signed-in' : 'confirm-email';
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  queryClient.clear();
}
