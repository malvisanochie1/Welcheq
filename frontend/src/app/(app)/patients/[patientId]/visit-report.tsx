import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { EmptyState } from '@/components/layout/EmptyState';
import { ErrorState } from '@/components/layout/ErrorState';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { ReadingList } from '@/features/health-records/components/ReadingList';
import { VisitReportForm } from '@/features/health-records/components/VisitReportForm';
import { VisitReportSummary } from '@/features/health-records/components/VisitReportSummary';
import { useVisitReport } from '@/features/health-records/hooks/use-health-records';
import { usePatient } from '@/features/patients/hooks/use-patients';
import { formatDay, formatTime } from '@/lib/format-date';

const SKELETON_HEIGHT = 320;

export default function VisitReportScreen() {
  const { patientId, visitId } = useLocalSearchParams<{ patientId: string; visitId: string }>();
  const patient = usePatient(patientId);
  const visitReport = useVisitReport(patientId, visitId);
  const [isEditing, setIsEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  if (visitReport.isError) {
    return (
      <ErrorState
        title="We couldn't open this report"
        message={visitReport.error.message}
        onRetry={() => visitReport.refetch()}
      />
    );
  }

  const data = visitReport.data;
  const firstName = patient.data?.fullName.split(' ')[0] ?? '';
  const subtitle = data
    ? `${data.visit.caregiverName} · ${formatDay(data.visit.checkInAt)}, ${formatTime(data.visit.checkInAt)}${
        data.visit.checkOutAt ? `–${formatTime(data.visit.checkOutAt)}` : ''
      }`
    : undefined;
  const showForm = Boolean(data?.canEdit) && (!data?.report || isEditing);

  return (
    <Screen contentClassName="gap-6">
      <ScreenHeader canGoBack title="Visit report" subtitle={subtitle} />

      {!data || !patient.data ? (
        <Skeleton height={SKELETON_HEIGHT} />
      ) : showForm ? (
        <VisitReportForm
          patientId={patientId}
          visitId={visitId}
          patientFirstName={firstName}
          existing={data.report}
          onSaved={() => {
            setIsEditing(false);
            setJustSaved(true);
          }}
        />
      ) : (
        <View className="gap-6">
          {justSaved && (
            <FormMessage tone="info" message="Report saved. The family can see it now." />
          )}
          {data.report ? (
            <VisitReportSummary report={data.report} />
          ) : (
            <EmptyState
              title="No report yet"
              message={`${data.visit.caregiverName} hasn't written about this visit.`}
            />
          )}
          {data.canEdit && (
            <Button
              label="Change report or add readings"
              variant="secondary"
              onPress={() => {
                setJustSaved(false);
                setIsEditing(true);
              }}
            />
          )}
        </View>
      )}

      {data && data.readings.length > 0 && (
        <View className="gap-3">
          <Text variant="heading">Readings</Text>
          <ReadingList readings={data.readings} showDay={false} />
        </View>
      )}

      {justSaved && <Button label="Done" variant="ghost" onPress={() => router.back()} />}
    </Screen>
  );
}
