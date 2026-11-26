import type { AcceptInvitationInput } from '@welcheq/shared';

import { apiRequest } from '@/lib/api-client';

export interface DisplayPairingResult {
  patientFirstName: string;
  secret: string;
  periodSeconds: number;
  digits: number;
}

export interface DisplayPairingCode {
  code: string;
  expiresAt: string;
}

const patientPath = (patientId: string) =>
  `/v1/patients/${encodeURIComponent(patientId)}/home-display`;

export const homeDisplayApi = {
  pair: (input: AcceptInvitationInput) =>
    apiRequest<DisplayPairingResult>('/v1/home-display/pair', { method: 'POST', body: input }),
  createPairingCode: (patientId: string) =>
    apiRequest<DisplayPairingCode>(`${patientPath(patientId)}/pairing`, { method: 'POST' }),
  reset: (patientId: string) =>
    apiRequest<void>(`${patientPath(patientId)}/reset`, { method: 'POST' }),
};
