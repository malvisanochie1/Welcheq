import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { EmptyState } from '@/components/layout/EmptyState';
import { ErrorState } from '@/components/layout/ErrorState';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { READING_HISTORY_DAYS } from '@/config/health-records';
import { useDateRange } from '@/features/attendance/hooks/use-local-dates';
import { AddReadingForm } from '@/features/health-records/components/AddReadingForm';
import { ReadingList } from '@/features/health-records/components/ReadingList';
import { useReadings } from '@/features/health-records/hooks/use-health-records';
import { usePatient } from '@/features/patients/hooks/use-patients';

const SKELETON_HEIGHT = 240;

export default function ReadingsScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const patient = usePatient(patientId);
  const range = useDateRange(READING_HISTORY_DAYS, 0, patient.data?.timeZone);
  const readings = useReadings(patientId, range);
  const latestFirst = [...(readings.data ?? [])].reverse();

  if (readings.isError) {
    return (
      <ErrorState
        title="We couldn't load readings"
        message={readings.error.message}
        onRetry={() => readings.refetch()}
      />
    );
  }

  return (
    <Screen contentClassName="gap-6">
      <ScreenHeader
        canGoBack
        title="Health readings"
        subtitle={`Last ${READING_HISTORY_DAYS} days · who took each one is shown`}
      />

      {patient.data && <AddReadingForm patientId={patientId} />}

      {!readings.data ? (
        <Skeleton height={SKELETON_HEIGHT} />
      ) : latestFirst.length === 0 ? (
        <EmptyState
          title="No readings yet"
          message="Blood pressure, pulse, temperature and others appear here once someone records them."
        />
      ) : (
        <View className="gap-3">
          <Text variant="heading">History</Text>
          <ReadingList readings={latestFirst} />
        </View>
      )}
    </Screen>
  );
}
