import {
  CARE_RELATIONSHIP,
  INVITABLE_RELATIONSHIPS,
  type InvitableRelationship,
} from '@welcheq/shared';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Text } from '@/components/ui/Text';
import { INVITE_COPY } from '@/config/care-team';
import { InvitationCodeCard } from '@/features/care-team/components/InvitationCodeCard';
import { useCreateInvitation } from '@/features/care-team/hooks/use-care-team';
import { usePatient } from '@/features/patients/hooks/use-patients';
import { ApiError } from '@/lib/api-client';

const isInvitable = (value: string | undefined): value is InvitableRelationship =>
  (INVITABLE_RELATIONSHIPS as readonly string[]).includes(value ?? '');

export default function InviteScreen() {
  const params = useLocalSearchParams<{ patientId: string; relationship: string }>();
  const relationship = isInvitable(params.relationship)
    ? params.relationship
    : CARE_RELATIONSHIP.CAREGIVER;
  const patient = usePatient(params.patientId);
  const createInvitation = useCreateInvitation(params.patientId);
  const copy = INVITE_COPY[relationship];

  const errorMessage =
    createInvitation.error instanceof ApiError
      ? createInvitation.error.message
      : createInvitation.error && 'Please try again.';

  return (
    <Screen contentClassName="gap-8">
      <ScreenHeader
        canGoBack
        title={copy.title}
        subtitle={patient.data ? `To ${patient.data.fullName}'s care team` : undefined}
      />

      {createInvitation.data && patient.data ? (
        <InvitationCodeCard code={createInvitation.data.code} patientName={patient.data.fullName} />
      ) : (
        <View className="gap-6">
          <Text variant="body" className="text-ink-muted">
            {copy.explanation}
          </Text>
          {errorMessage && <FormMessage message={errorMessage} />}
          <Button
            label="Create invite code"
            onPress={() => createInvitation.mutate({ relationship })}
            isLoading={createInvitation.isPending}
          />
        </View>
      )}
    </Screen>
  );
}
