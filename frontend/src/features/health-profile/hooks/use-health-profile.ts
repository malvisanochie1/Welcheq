import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { healthProfileApi } from '../api/health-profile.api';

const profileKey = (patientId: string) => ['health-profile', patientId] as const;
const documentsKey = (patientId: string) => ['health-documents', patientId] as const;

export function useHealthProfile(patientId: string) {
  return useQuery({
    queryKey: profileKey(patientId),
    queryFn: () => healthProfileApi.profile(patientId),
  });
}

/** Wraps a health profile change so the record refreshes once it succeeds. */
export function useHealthProfileChange<TInput>(
  patientId: string,
  change: (input: TInput) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: change,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKey(patientId) }),
  });
}

export function useHealthDocuments(patientId: string) {
  return useQuery({
    queryKey: documentsKey(patientId),
    queryFn: () => healthProfileApi.documents(patientId),
  });
}

export function useHealthDocumentChange<TInput>(
  patientId: string,
  change: (input: TInput) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: change,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentsKey(patientId) }),
  });
}
