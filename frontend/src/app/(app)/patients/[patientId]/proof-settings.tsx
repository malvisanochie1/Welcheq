import { CARE_RELATIONSHIP } from '@welcheq/shared';
import { router, useLocalSearchParams } from 'expo-router';

import { ErrorState } from '@/components/layout/ErrorState';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { HomeDisplaySettings } from '@/features/home-display/components/HomeDisplaySettings';
import { ProofSettingsForm } from '@/features/patients/components/ProofSettingsForm';
import { usePatient } from '@/features/patients/hooks/use-patients';

const SKELETON_HEIGHT = 320;

export default function ProofSettingsScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const patient = usePatient(patientId);

  if (patient.isError) {
    return (
      <ErrorState
        title="We couldn't load these settings"
        message={patient.error.message}
        onRetry={() => patient.refetch()}
      />
    );
  }

  return (
    <Screen contentClassName="gap-8">
      <ScreenHeader
        canGoBack
        title="Proof of visit"
        subtitle="Choose how caregivers show they really came. Location is always checked."
      />
      {patient.data ? (
        <>
          <ProofSettingsForm patient={patient.data} onSaved={() => router.back()} />
          {patient.data.relationship === CARE_RELATIONSHIP.OWNER && (
            <HomeDisplaySettings
              patientId={patientId}
              isConfigured={patient.data.isHomeDisplayConfigured}
            />
          )}
        </>
      ) : (
        <Skeleton height={SKELETON_HEIGHT} />
      )}
    </Screen>
  );
}
