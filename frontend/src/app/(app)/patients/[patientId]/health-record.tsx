import { FAMILY_RELATIONSHIPS, PATIENT_EDITOR_RELATIONSHIPS } from '@welcheq/shared';
import { useLocalSearchParams } from 'expo-router';

import { ErrorState } from '@/components/layout/ErrorState';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { AllergiesSection } from '@/features/health-profile/components/AllergiesSection';
import { ConditionsSection } from '@/features/health-profile/components/ConditionsSection';
import { DocumentsSection } from '@/features/health-profile/components/DocumentsSection';
import { MedicationsSection } from '@/features/health-profile/components/MedicationsSection';
import { ShareRecordCard } from '@/features/health-profile/components/ShareRecordCard';
import { useHealthProfile } from '@/features/health-profile/hooks/use-health-profile';
import { usePatient } from '@/features/patients/hooks/use-patients';

const SKELETON_HEIGHT = 320;

export default function HealthRecordScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const patient = usePatient(patientId);
  const profile = useHealthProfile(patientId);
  const canEdit = (PATIENT_EDITOR_RELATIONSHIPS as readonly string[]).includes(
    patient.data?.relationship ?? '',
  );

  const isFamily = (FAMILY_RELATIONSHIPS as readonly string[]).includes(
    patient.data?.relationship ?? '',
  );

  if (profile.isError) {
    return (
      <ErrorState
        title="We couldn't open the health record"
        message={profile.error.message}
        onRetry={() => profile.refetch()}
      />
    );
  }

  return (
    <Screen contentClassName="gap-8">
      <ScreenHeader
        canGoBack
        title="Health record"
        subtitle={
          canEdit
            ? 'Everyone on the care team can see this. Only you can change it.'
            : 'Kept up to date by the family.'
        }
      />
      {!profile.data ? (
        <Skeleton height={SKELETON_HEIGHT} />
      ) : (
        <>
          <AllergiesSection
            patientId={patientId}
            allergies={profile.data.allergies}
            canEdit={canEdit}
          />
          <MedicationsSection
            patientId={patientId}
            medications={profile.data.medications}
            canEdit={canEdit}
          />
          <ConditionsSection
            patientId={patientId}
            conditions={profile.data.conditions}
            canEdit={canEdit}
          />
          <DocumentsSection patientId={patientId} canEdit={canEdit} />
          {isFamily && patient.data && (
            <ShareRecordCard patientId={patientId} patientName={patient.data.fullName} />
          )}
        </>
      )}
    </Screen>
  );
}
