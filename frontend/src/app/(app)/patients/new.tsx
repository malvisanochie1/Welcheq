import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { RegisterPatientForm } from '@/features/patients/components/RegisterPatientForm';

export default function NewPatientScreen() {
  return (
    <Screen contentClassName="gap-8">
      <ScreenHeader
        canGoBack
        title="Add a loved one"
        subtitle="You can change any of this later."
      />
      <RegisterPatientForm
        onRegistered={(patient) =>
          router.replace({ pathname: '/patients/[patientId]', params: { patientId: patient.id } })
        }
      />
    </Screen>
  );
}
