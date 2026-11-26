import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ChecklistView } from '@/features/care-plan/components/ChecklistView';
import { usePatient } from '@/features/patients/hooks/use-patients';

export default function ChecklistScreen() {
  const { patientId, date } = useLocalSearchParams<{ patientId: string; date?: string }>();
  const patient = usePatient(patientId);

  return (
    <Screen contentClassName="gap-6">
      <ScreenHeader canGoBack title="Daily checklist" subtitle={patient.data?.fullName} />
      <ChecklistView
        patientId={patientId}
        date={date}
        onSelectDate={(selected) => router.setParams({ date: selected })}
      />
    </Screen>
  );
}
