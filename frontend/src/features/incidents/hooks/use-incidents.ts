import { INCIDENT_STATUS, type IncidentInput } from '@welcheq/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { incidentsApi } from '../api/incidents.api';

const incidentsKey = (patientId: string) => ['incidents', patientId] as const;

export function useIncidents(patientId: string) {
  return useQuery({
    queryKey: incidentsKey(patientId),
    queryFn: () => incidentsApi.list(patientId),
  });
}

export function useOpenIncidentCount(patientId: string): number {
  const incidents = useIncidents(patientId);
  return (incidents.data ?? []).filter((incident) => incident.status === INCIDENT_STATUS.OPEN)
    .length;
}

export function useReportIncident(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: IncidentInput) => incidentsApi.report(patientId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: incidentsKey(patientId) }),
  });
}

export function useResolveIncident(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ incidentId, resolutionNote }: { incidentId: string; resolutionNote: string }) =>
      incidentsApi.resolve(patientId, incidentId, resolutionNote),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: incidentsKey(patientId) }),
  });
}
