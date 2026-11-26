import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { JoinWithCodeForm } from '@/features/care-team/components/JoinWithCodeForm';

export default function JoinScreen() {
  return (
    <Screen contentClassName="gap-8">
      <ScreenHeader
        canGoBack
        title="Join with a code"
        subtitle="Enter the code the family or agency sent you."
      />
      <JoinWithCodeForm
        onJoined={({ patientId }) =>
          router.replace({ pathname: '/patients/[patientId]', params: { patientId } })
        }
      />
    </Screen>
  );
}
