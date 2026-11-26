import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSessionStore } from '../stores/session.store';
import { profileApi } from '../api/profile.api';

export const OWN_PROFILE_QUERY_KEY = ['profile', 'own'] as const;

export function useOwnProfile() {
  const userId = useSessionStore((state) => state.session?.user.id);

  return useQuery({
    queryKey: [...OWN_PROFILE_QUERY_KEY, userId],
    queryFn: profileApi.fetchOwn,
    enabled: Boolean(userId),
  });
}

export function useCompleteProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileApi.complete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: OWN_PROFILE_QUERY_KEY }),
  });
}
