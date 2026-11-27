import { apiRequest } from '@/lib/api-client';
import { supabase } from '@/lib/supabase';

export type DemoPersona = 'family' | 'caregiver';

export class DemoError extends Error {
  override name = 'DemoError';
}

/** Signs in to a shared demo account with a one-time link issued by the server. */
export async function startDemo(persona: DemoPersona): Promise<void> {
  const { tokenHash } = await apiRequest<{ email: string; tokenHash: string }>('/v1/demo/session', {
    method: 'POST',
    body: { persona },
  });
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' });
  if (error) {
    throw new DemoError('The demo could not start. Please try again in a moment.');
  }
}
