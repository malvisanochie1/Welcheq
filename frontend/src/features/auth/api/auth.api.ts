import type { SignInInput, SignUpInput } from '@welcheq/shared';

import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

const GENERIC_SIGN_IN_ERROR = 'Email or password is incorrect.';
const GENERIC_FAILURE = 'Something went wrong. Please try again.';

export class AuthError extends Error {
  override name = 'AuthError';
}

export async function signInWithPassword(input: SignInInput): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword(input);
  if (error) {
    throw new AuthError(GENERIC_SIGN_IN_ERROR);
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
  const { data, error } = await supabase.auth.signUp(input);
  if (error) {
    throw new AuthError(error.status === 422 ? error.message : GENERIC_FAILURE);
  }
  return data.session ? 'signed-in' : 'confirm-email';
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  queryClient.clear();
}
