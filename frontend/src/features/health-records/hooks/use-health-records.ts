import type { ReadingInput, VisitReportInput } from '@welcheq/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ATTENDANCE_KEY } from '@/features/attendance/hooks/use-attendance';
import { healthRecordsApi, type ReadingQuery } from '../api/health-records.api';

const READINGS_KEY = 'readings';
const reportKey = (patientId: string, visitId: string) =>
  ['visit-report', patientId, visitId] as const;
const readingsKey = (patientId: string) => [READINGS_KEY, patientId] as const;

export function useVisitReport(patientId: string, visitId: string) {
  return useQuery({
    queryKey: reportKey(patientId, visitId),
    queryFn: () => healthRecordsApi.visitReport(patientId, visitId),
  });
}

export function useSaveVisitReport(patientId: string, visitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: VisitReportInput) =>
      healthRecordsApi.saveVisitReport(patientId, visitId, input),
    onSuccess: (saved) => {
      queryClient.setQueryData(reportKey(patientId, visitId), saved);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: readingsKey(patientId) }),
        queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEY }),
      ]);
    },
  });
}

export function useReadings(patientId: string, query: ReadingQuery) {
  return useQuery({
    queryKey: [...readingsKey(patientId), query],
    queryFn: () => healthRecordsApi.readings(patientId, query),
  });
}

export function useAddReading(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reading: ReadingInput) => healthRecordsApi.addReading(patientId, reading),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: readingsKey(patientId) }),
  });
}
