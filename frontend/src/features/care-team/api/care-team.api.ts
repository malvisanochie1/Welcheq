import type {
  AcceptInvitationInput,
  CareRelationship,
  CreateInvitationInput,
  InvitableRelationship,
} from '@welcheq/shared';

import { apiRequest } from '@/lib/api-client';

export interface CareTeamMember {
  userId: string;
  fullName: string;
  phone: string | null;
  relationship: CareRelationship;
  memberSince: string;
}

export interface PendingInvitation {
  id: string;
  relationship: InvitableRelationship;
  createdAt: string;
  expiresAt: string;
}

export interface CreatedInvitation extends PendingInvitation {
  code: string;
}

export interface AcceptedInvitation {
  patientId: string;
  patientName: string;
  relationship: CareRelationship;
}

const patientPath = (patientId: string) => `/v1/patients/${encodeURIComponent(patientId)}`;

export const careTeamApi = {
  listMembers: (patientId: string) =>
    apiRequest<CareTeamMember[]>(`${patientPath(patientId)}/members`),
  removeMember: (patientId: string, userId: string) =>
    apiRequest<void>(`${patientPath(patientId)}/members/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    }),
  listPendingInvitations: (patientId: string) =>
    apiRequest<PendingInvitation[]>(`${patientPath(patientId)}/invitations`),
  createInvitation: (patientId: string, input: CreateInvitationInput) =>
    apiRequest<CreatedInvitation>(`${patientPath(patientId)}/invitations`, {
      method: 'POST',
      body: input,
    }),
  revokeInvitation: (patientId: string, invitationId: string) =>
    apiRequest<void>(`${patientPath(patientId)}/invitations/${encodeURIComponent(invitationId)}`, {
      method: 'DELETE',
    }),
  acceptInvitation: (input: AcceptInvitationInput) =>
    apiRequest<AcceptedInvitation>('/v1/invitations/accept', { method: 'POST', body: input }),
};
