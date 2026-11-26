import type { CreateInvitationInput } from '@welcheq/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { PATIENTS_QUERY_KEY } from '@/features/patients/hooks/use-patients';
import { careTeamApi } from '../api/care-team.api';

const membersKey = (patientId: string) => ['care-team', patientId, 'members'] as const;
const invitationsKey = (patientId: string) => ['care-team', patientId, 'invitations'] as const;

export function useCareTeam(patientId: string) {
  return useQuery({
    queryKey: membersKey(patientId),
    queryFn: () => careTeamApi.listMembers(patientId),
  });
}

export function usePendingInvitations(patientId: string, isEnabled: boolean) {
  return useQuery({
    queryKey: invitationsKey(patientId),
    queryFn: () => careTeamApi.listPendingInvitations(patientId),
    enabled: isEnabled,
  });
}

export function useCreateInvitation(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvitationInput) => careTeamApi.createInvitation(patientId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invitationsKey(patientId) }),
  });
}

export function useRevokeInvitation(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => careTeamApi.revokeInvitation(patientId, invitationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invitationsKey(patientId) }),
  });
}

export function useRemoveMember(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => careTeamApi.removeMember(patientId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: membersKey(patientId) }),
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: careTeamApi.acceptInvitation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY }),
  });
}
