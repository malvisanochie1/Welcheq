import type {
  ReadingInput,
  ReadingSource,
  ReadingType,
  VisitReportInput,
  Wellbeing,
} from '@welcheq/shared';

import { apiRequest } from '@/lib/api-client';

export interface Reading {
  id: string;
  type: ReadingType;
  value: number;
  secondaryValue: number | null;
  unit: string;
  measuredAt: string;
  source: ReadingSource;
  visitId: string | null;
  recordedBy: string;
}

export interface VisitReport {
  visit: { checkInAt: string; checkOutAt: string | null; caregiverName: string };
  canEdit: boolean;
  report: { wellbeing: Wellbeing; notes: string | null; updatedAt: string; author: string } | null;
  readings: Reading[];
}

export interface ReadingQuery {
  type?: ReadingType;
  from: string;
  to: string;
}

const patientPath = (patientId: string) => `/v1/patients/${encodeURIComponent(patientId)}`;
const reportPath = (patientId: string, visitId: string) =>
  `${patientPath(patientId)}/visits/${encodeURIComponent(visitId)}/report`;

export const healthRecordsApi = {
  visitReport: (patientId: string, visitId: string) =>
    apiRequest<VisitReport>(reportPath(patientId, visitId)),
  saveVisitReport: (patientId: string, visitId: string, input: VisitReportInput) =>
    apiRequest<VisitReport>(reportPath(patientId, visitId), { method: 'PUT', body: input }),
  readings: (patientId: string, { type, from, to }: ReadingQuery) => {
    const query = new URLSearchParams({ from, to, ...(type ? { type } : {}) });
    return apiRequest<Reading[]>(`${patientPath(patientId)}/readings?${query.toString()}`);
  },
  addReading: (patientId: string, reading: ReadingInput) =>
    apiRequest<Reading>(`${patientPath(patientId)}/readings`, { method: 'POST', body: reading }),
};
