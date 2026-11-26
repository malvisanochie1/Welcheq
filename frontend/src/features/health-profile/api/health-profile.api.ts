import type {
  AllergyInput,
  AllergySeverity,
  ConditionInput,
  MedicationInput,
} from '@welcheq/shared';

import { apiRequest } from '@/lib/api-client';

export interface Medication {
  id: string;
  name: string;
  dose: string | null;
  instructions: string | null;
  stoppedAt: string | null;
  updatedAt: string;
  addedBy: string;
}

export interface Allergy {
  id: string;
  substance: string;
  reaction: string | null;
  severity: AllergySeverity;
  updatedAt: string;
}

export interface Condition {
  id: string;
  name: string;
  notes: string | null;
  diagnosedOn: string | null;
  updatedAt: string;
}

export interface HealthProfile {
  medications: Medication[];
  allergies: Allergy[];
  conditions: Condition[];
}

export interface HealthDocument {
  id: string;
  title: string;
  createdAt: string;
  uploadedBy: string;
}

const profilePath = (patientId: string) =>
  `/v1/patients/${encodeURIComponent(patientId)}/health-profile`;
const entryPath = (patientId: string, kind: string, id: string) =>
  `${profilePath(patientId)}/${kind}/${encodeURIComponent(id)}`;

export const healthProfileApi = {
  profile: (patientId: string) => apiRequest<HealthProfile>(profilePath(patientId)),

  addMedication: (patientId: string, input: MedicationInput) =>
    apiRequest<Medication>(`${profilePath(patientId)}/medications`, {
      method: 'POST',
      body: input,
    }),
  updateMedication: (patientId: string, id: string, input: MedicationInput) =>
    apiRequest<Medication>(entryPath(patientId, 'medications', id), { method: 'PUT', body: input }),
  stopMedication: (patientId: string, id: string) =>
    apiRequest<void>(`${entryPath(patientId, 'medications', id)}/stop`, { method: 'POST' }),

  addAllergy: (patientId: string, input: AllergyInput) =>
    apiRequest<Allergy>(`${profilePath(patientId)}/allergies`, { method: 'POST', body: input }),
  removeAllergy: (patientId: string, id: string) =>
    apiRequest<void>(entryPath(patientId, 'allergies', id), { method: 'DELETE' }),

  addCondition: (patientId: string, input: ConditionInput) =>
    apiRequest<Condition>(`${profilePath(patientId)}/conditions`, { method: 'POST', body: input }),
  removeCondition: (patientId: string, id: string) =>
    apiRequest<void>(entryPath(patientId, 'conditions', id), { method: 'DELETE' }),

  documents: (patientId: string) =>
    apiRequest<HealthDocument[]>(`${profilePath(patientId)}/documents`),
  requestDocumentUpload: (patientId: string) =>
    apiRequest<{ path: string; uploadUrl: string }>(`${profilePath(patientId)}/documents/upload`, {
      method: 'POST',
    }),
  addDocument: (patientId: string, title: string, path: string) =>
    apiRequest<HealthDocument>(`${profilePath(patientId)}/documents`, {
      method: 'POST',
      body: { title, path },
    }),
  viewDocument: (patientId: string, id: string) =>
    apiRequest<{ url: string; expiresAt: string }>(entryPath(patientId, 'documents', id)),
  removeDocument: (patientId: string, id: string) =>
    apiRequest<void>(entryPath(patientId, 'documents', id), { method: 'DELETE' }),
};
