import { CARE_RELATIONSHIP, INVITABLE_RELATIONSHIPS } from '@welcheq/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { INVITE_COPY, RELATIONSHIP_LABEL } from '@/config/care-team';
import type { Patient } from '@/features/patients/api/patients.api';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import {
  useCareTeam,
  usePendingInvitations,
  useRemoveMember,
  useRevokeInvitation,
} from '../hooks/use-care-team';

const SKELETON_HEIGHT = 64;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export interface CareTeamSectionProps {
  patient: Patient;
}

export function CareTeamSection({ patient }: CareTeamSectionProps) {
  const isOwner = patient.relationship === CARE_RELATIONSHIP.OWNER;
  const members = useCareTeam(patient.id);
  const invitations = usePendingInvitations(patient.id, isOwner);
  const removeMember = useRemoveMember(patient.id);
  const revokeInvitation = useRevokeInvitation(patient.id);
  const [confirmingRemoval, setConfirmingRemoval] = useState<string | null>(null);

  const actionError = [removeMember.error, revokeInvitation.error].find(Boolean);

  return (
    <View className="gap-4">
      <Text variant="heading">Care team</Text>
      {actionError && (
        <FormMessage
          message={actionError instanceof ApiError ? actionError.message : 'Please try again.'}
        />
      )}

      {members.data ? (
        <View className="rounded-lg border border-border bg-surface px-4">
          {members.data.map((member, index) => {
            const canRemove = isOwner && member.relationship !== CARE_RELATIONSHIP.OWNER;
            const isConfirming = confirmingRemoval === member.userId;
            return (
              <View
                key={member.userId}
                className={cn('gap-3 py-4', index > 0 && 'border-t border-border')}
              >
                <View className="flex-row items-center gap-3">
                  <View className="flex-1 gap-1">
                    <Text variant="label" className="text-base">
                      {member.fullName}
                    </Text>
                    <Text variant="caption">
                      {[RELATIONSHIP_LABEL[member.relationship], member.phone]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                  {canRemove && !isConfirming && (
                    <Button
                      label="Remove"
                      variant="ghost"
                      onPress={() => setConfirmingRemoval(member.userId)}
                    />
                  )}
                </View>
                {isConfirming && (
                  <View className="gap-2 rounded-md bg-danger-soft p-3">
                    <Text variant="label" className="text-danger">
                      {member.fullName} will lose access straight away.
                    </Text>
                    <View className="flex-row gap-2">
                      <View className="flex-1">
                        <Button
                          label="Remove"
                          onPress={() =>
                            removeMember.mutate(member.userId, {
                              onSettled: () => setConfirmingRemoval(null),
                            })
                          }
                          isLoading={removeMember.isPending}
                        />
                      </View>
                      <View className="flex-1">
                        <Button
                          label="Keep"
                          variant="secondary"
                          onPress={() => setConfirmingRemoval(null)}
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ) : (
        <Skeleton height={SKELETON_HEIGHT} />
      )}

      {isOwner && invitations.data && invitations.data.length > 0 && (
        <View className="gap-2">
          <Text variant="label" className="text-ink-muted">
            Waiting to join
          </Text>
          {invitations.data.map((invitation) => (
            <View
              key={invitation.id}
              className="flex-row items-center gap-3 rounded-md border border-dashed border-border px-4 py-2"
            >
              <Text variant="caption" className="flex-1">
                {RELATIONSHIP_LABEL[invitation.relationship]} · code expires{' '}
                {formatDate(invitation.expiresAt)}
              </Text>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => revokeInvitation.mutate(invitation.id)}
              />
            </View>
          ))}
        </View>
      )}

      {isOwner && (
        <View className="gap-2">
          {INVITABLE_RELATIONSHIPS.map((relationship, index) => (
            <Button
              key={relationship}
              label={INVITE_COPY[relationship].action}
              variant={index === 0 ? 'primary' : 'secondary'}
              onPress={() =>
                router.push({
                  pathname: '/patients/[patientId]/invite',
                  params: { patientId: patient.id, relationship },
                })
              }
            />
          ))}
        </View>
      )}
    </View>
  );
}
