import { CARE_RELATIONSHIP } from '@welcheq/shared';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { DeleteAccountForm } from '@/features/auth/components/DeleteAccountForm';
import { useOwnProfile } from '@/features/auth/hooks/use-own-profile';
import { usePatients } from '@/features/patients/hooks/use-patients';

export default function DeleteAccountScreen() {
  const { data: profile } = useOwnProfile();
  const patients = usePatients();
  const owned = (patients.data ?? []).filter(
    (patient) => patient.relationship === CARE_RELATIONSHIP.OWNER,
  );

  const consequences = [
    'You will be signed out and can no longer sign in with this email.',
    'Your name, email and phone number are removed.',
    owned.length > 0
      ? `${owned.map((patient) => patient.fullName).join(', ')} and everything recorded for them will be deleted, for everyone on the care team.`
      : null,
    'Visits and notes you recorded for other families stay in their history, shown as "Deleted user".',
    'This cannot be undone.',
  ].filter((line): line is string => line !== null);

  return (
    <Screen contentClassName="gap-6">
      <ScreenHeader canGoBack title="Delete your account" />
      <View className="gap-3 rounded-lg border border-danger bg-danger-soft p-4">
        <Text variant="heading">What happens</Text>
        {consequences.map((line) => (
          <Text key={line} variant="body">
            • {line}
          </Text>
        ))}
      </View>
      {profile && <DeleteAccountForm email={profile.email} />}
      <Button label="Keep my account" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
