import type { CompleteProfileInput, UserRole } from '@welcheq/shared';

import { ApiError, apiRequest } from '@/lib/api-client';

const NOT_FOUND = 404;

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
}

export const profileApi = {
  /** Null means signed in but not set up yet, which is a normal step, not a failure. */
  fetchOwn: async (): Promise<Profile | null> => {
    try {
      return await apiRequest<Profile>('/v1/me');
    } catch (error) {
      if (error instanceof ApiError && error.status === NOT_FOUND) return null;
      throw error;
    }
  },
  deleteOwn: () => apiRequest<void>('/v1/me', { method: 'DELETE' }),
  complete: (input: CompleteProfileInput) =>
    apiRequest<Profile>('/v1/me', { method: 'POST', body: input }),
};
