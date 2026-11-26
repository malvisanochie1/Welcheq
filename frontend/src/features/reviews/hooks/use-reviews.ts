import type { ReviewInput } from '@welcheq/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { reviewsApi } from '../api/reviews.api';

const profileKey = (patientId: string, caregiverId: string) =>
  ['caregiver-profile', patientId, caregiverId] as const;

export function useCaregiverProfile(patientId: string, caregiverId: string) {
  return useQuery({
    queryKey: profileKey(patientId, caregiverId),
    queryFn: () => reviewsApi.profile(patientId, caregiverId),
  });
}

export function useReviewCaregiver(patientId: string, caregiverId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReviewInput) => reviewsApi.review(patientId, caregiverId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: profileKey(patientId, caregiverId) }),
  });
}
