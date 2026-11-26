import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ErrorState } from '@/components/layout/ErrorState';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import type { RecordedCall } from '@/features/daily-call/api/daily-call.api';
import { CallAnswersForm } from '@/features/daily-call/components/CallAnswersForm';
import { CallResult } from '@/features/daily-call/components/CallResult';
import { useDailyCallPlan } from '@/features/daily-call/hooks/use-daily-call';

const SKELETON_HEIGHT = 320;

export default function DailyCallScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const plan = useDailyCallPlan(patientId);
  const [recorded, setRecorded] = useState<RecordedCall | null>(null);

  if (plan.isError) {
    return (
      <ErrorState
        title="We couldn't prepare the call"
        message={plan.error.message}
        onRetry={() => plan.refetch()}
      />
    );
  }

  const firstName = plan.data?.patientFirstName ?? '';

  return (
    <Screen contentClassName="gap-6">
      <ScreenHeader
        canGoBack
        title={firstName ? `What did ${firstName} say?` : 'Daily call'}
        subtitle="Tap the answer they gave for each one."
      />
      {!plan.data ? (
        <Skeleton height={SKELETON_HEIGHT} />
      ) : recorded ? (
        <CallResult call={recorded} patientFirstName={firstName} onDone={() => router.back()} />
      ) : (
        <CallAnswersForm
          patientId={patientId}
          plan={plan.data}
          onRecorded={setRecorded}
          onRemindLater={() => router.back()}
        />
      )}
    </Screen>
  );
}
