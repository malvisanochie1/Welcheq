import type { CompleteProfileInput, UserRole } from '@welcheq/shared';

import { apiRequest } from '@/lib/api-client';

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
}

export const profileApi = {
  fetchOwn: () => apiRequest<Profile>('/v1/me'),
  complete: (input: CompleteProfileInput) =>
    apiRequest<Profile>('/v1/me', { method: 'POST', body: input }),
};
