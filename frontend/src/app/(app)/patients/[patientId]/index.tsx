import { router, useLocalSearchParams } from 'expo-router';
import { ChevronRight, ShieldCheck } from 'lucide-react-native';
import { View } from 'react-native';

import { ErrorState } from '@/components/layout/ErrorState';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { PROOF_METHOD_OPTIONS } from '@/config/proof-methods';
import { CareTeamSection } from '@/features/care-team/components/CareTeamSection';
import { usePatient } from '@/features/patients/hooks/use-patients';
import { ageFromDateOfBirth } from '@/features/patients/lib/age';
import { palette } from '@/theme';

const ICON_SIZE = 20;
const SKELETON_HEIGHT = 120;

export default function PatientScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const patient = usePatient(patientId);

  if (patient.isError) {
    return (
      <ErrorState
        title="We couldn't open this patient"
        message={patient.error.message}
        onRetry={() => patient.refetch()}
      />
    );
  }

  if (!patient.data) {
    return (
      <Screen contentClassName="gap-4">
        <Skeleton height={SKELETON_HEIGHT} />
      </Screen>
    );
  }

  const { fullName, dateOfBirth, homeAddress, proofSettings } = patient.data;
  const age = ageFromDateOfBirth(dateOfBirth);
  const activeChecks = PROOF_METHOD_OPTIONS.filter((option) =>
    proofSettings.methods.includes(option.method),
  ).map((option) => option.title);

  return (
    <Screen contentClassName="gap-6">
      <ScreenHeader
        canGoBack
        title={fullName}
        subtitle={[age !== null ? `${age} years old` : null, homeAddress]
          .filter(Boolean)
          .join(' · ')}
      />

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Proof of visit settings"
        accessibilityHint={`Active: ${activeChecks.join(', ')}`}
        onPress={() =>
          router.push({
            pathname: '/patients/[patientId]/proof-settings',
            params: { patientId },
          })
        }
        className="flex-row items-center gap-4 rounded-lg border border-border bg-surface p-4"
      >
        <View className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft">
          <ShieldCheck size={ICON_SIZE} color={palette.primary} />
        </View>
        <View className="flex-1 gap-1">
          <Text variant="heading" className="text-base">
            Proof of visit
          </Text>
          <Text variant="caption">{activeChecks.join(' · ')}</Text>
        </View>
        <ChevronRight size={ICON_SIZE} color={palette['ink-subtle']} />
      </PressableScale>

      <CareTeamSection patient={patient.data} />
    </Screen>
  );
}
