import { addDays } from '@welcheq/shared';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ScheduleVisitForm } from '@/features/attendance/components/ScheduleVisitForm';
import { useLocalToday } from '@/features/attendance/hooks/use-local-dates';
import { usePatient } from '@/features/patients/hooks/use-patients';

export default function ScheduleVisitScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const patient = usePatient(patientId);
  const today = useLocalToday(patient.data?.timeZone);

  return (
    <Screen contentClassName="gap-8">
      <ScreenHeader
        canGoBack
        title="Schedule a visit"
        subtitle="Times are in the patient's local time."
      />
      <ScheduleVisitForm
        patientId={patientId}
        defaultDate={addDays(today, 1)}
        onScheduled={() => router.back()}
      />
    </Screen>
  );
}
