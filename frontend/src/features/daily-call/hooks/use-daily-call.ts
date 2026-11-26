import type { RecordDailyCallInput } from '@welcheq/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { PATIENTS_QUERY_KEY } from '@/features/patients/hooks/use-patients';
import { dailyCallApi } from '../api/daily-call.api';

const planKey = (patientId: string) => ['daily-call', patientId] as const;

export function useDailyCallPlan(patientId: string, isEnabled = true) {
  return useQuery({
    queryKey: planKey(patientId),
    queryFn: () => dailyCallApi.plan(patientId),
    enabled: isEnabled,
  });
}

export function useRecordDailyCall(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordDailyCallInput) => dailyCallApi.record(patientId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: planKey(patientId) }),
  });
}

export function useUpdatePatientPhone(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (phone: string | null) => dailyCallApi.updatePhone(patientId, phone),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: planKey(patientId) }),
        queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY }),
      ]),
  });
}
