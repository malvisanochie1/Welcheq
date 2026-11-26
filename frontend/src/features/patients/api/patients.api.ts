import type {
  CareRelationship,
  CreatePatientInput,
  ProofMethod,
  ProofSettingsInput,
  UpdatePatientInput,
} from '@welcheq/shared';

import { apiRequest } from '@/lib/api-client';

export interface Patient {
  id: string;
  fullName: string;
  dateOfBirth: string | null;
  homeAddress: string;
  homeLocation: { latitude: number; longitude: number };
  proofSettings: { methods: ProofMethod[]; geofenceRadiusMeters: number };
  relationship: CareRelationship;
  timeZone: string;
  isHomeDisplayConfigured: boolean;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

const patientPath = (patientId: string) => `/v1/patients/${encodeURIComponent(patientId)}`;

export const patientsApi = {
  list: () => apiRequest<Patient[]>('/v1/patients'),
  get: (patientId: string) => apiRequest<Patient>(patientPath(patientId)),
  create: (input: CreatePatientInput) =>
    apiRequest<Patient>('/v1/patients', { method: 'POST', body: input }),
  update: (patientId: string, input: UpdatePatientInput) =>
    apiRequest<Patient>(patientPath(patientId), { method: 'PATCH', body: input }),
  updateProofSettings: (patientId: string, input: ProofSettingsInput) =>
    apiRequest<Patient>(`${patientPath(patientId)}/proof-settings`, { method: 'PUT', body: input }),
};
