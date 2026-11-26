import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { IncidentForm } from '@/features/incidents/components/IncidentForm';

export default function ReportIncidentScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();

  return (
    <Screen contentClassName="gap-6">
      <ScreenHeader
        canGoBack
        title="Report an incident"
        subtitle="Everyone on the care team will see it. If it's an emergency, call for help first."
      />
      <IncidentForm patientId={patientId} onReported={() => router.back()} />
    </Screen>
  );
}
