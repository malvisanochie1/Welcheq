import type {
  IncidentCategory,
  IncidentInput,
  IncidentSeverity,
  IncidentStatus,
} from '@welcheq/shared';

import { apiRequest } from '@/lib/api-client';

export interface Incident {
  id: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  description: string;
  occurredAt: string;
  status: IncidentStatus;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  reportedBy: string;
  resolvedBy: string | null;
}

const incidentsPath = (patientId: string) =>
  `/v1/patients/${encodeURIComponent(patientId)}/incidents`;

export const incidentsApi = {
  list: (patientId: string) => apiRequest<Incident[]>(incidentsPath(patientId)),
  report: (patientId: string, input: IncidentInput) =>
    apiRequest<Incident>(incidentsPath(patientId), { method: 'POST', body: input }),
  resolve: (patientId: string, incidentId: string, resolutionNote: string) =>
    apiRequest<Incident>(`${incidentsPath(patientId)}/${encodeURIComponent(incidentId)}/resolve`, {
      method: 'POST',
      body: { resolutionNote },
    }),
};
