import { CARE_RELATIONSHIP } from '@welcheq/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { EmptyState } from '@/components/layout/EmptyState';
import { ErrorState } from '@/components/layout/ErrorState';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { IncidentCard } from '@/features/incidents/components/IncidentCard';
import { useIncidents } from '@/features/incidents/hooks/use-incidents';
import { usePatient } from '@/features/patients/hooks/use-patients';

const SKELETON_HEIGHT = 240;

export default function IncidentsScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const patient = usePatient(patientId);
  const incidents = useIncidents(patientId);
  const isOwner = patient.data?.relationship === CARE_RELATIONSHIP.OWNER;

  if (incidents.isError) {
    return (
      <ErrorState
        title="We couldn't load incidents"
        message={incidents.error.message}
        onRetry={() => incidents.refetch()}
      />
    );
  }

  return (
    <Screen contentClassName="gap-6">
      <ScreenHeader
        canGoBack
        title="Incidents"
        subtitle="Falls, missed medicine and anything the family should know about"
      />
      <Button
        label="Report an incident"
        onPress={() =>
          router.push({ pathname: '/patients/[patientId]/report-incident', params: { patientId } })
        }
      />

      {!incidents.data ? (
        <Skeleton height={SKELETON_HEIGHT} />
      ) : incidents.data.length === 0 ? (
        <EmptyState
          title="Nothing reported"
          message="When anyone on the care team reports an incident, it appears here for everyone."
        />
      ) : (
        <View className="gap-3">
          {incidents.data.map((incident) => (
            <IncidentCard
              key={incident.id}
              patientId={patientId}
              incident={incident}
              canResolve={isOwner}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
