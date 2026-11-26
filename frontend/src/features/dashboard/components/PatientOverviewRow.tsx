import { router } from 'expo-router';
import { View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { WELLBEING_DETAILS } from '@/config/health-records';
import { cn } from '@/lib/cn';
import { formatDay } from '@/lib/format-date';
import type { DashboardOverview } from '../api/dashboard.api';
import { formatRate } from '../lib/format-rate';

export interface PatientOverviewRowProps {
  patient: DashboardOverview['patients'][number];
  isFirst: boolean;
}

export function PatientOverviewRow({ patient, isFirst }: PatientOverviewRowProps) {
  const facts = [
    `${patient.completed} of ${patient.scheduled} visits`,
    `${formatRate(patient.onTimeRate)} on time`,
    patient.missed > 0 ? `${patient.missed} missed` : null,
    patient.openIncidents > 0
      ? `${patient.openIncidents} open incident${patient.openIncidents === 1 ? '' : 's'}`
      : null,
    patient.lastVisitAt ? `last visit ${formatDay(patient.lastVisitAt)}` : 'no visits yet',
  ].filter(Boolean);

  return (
    <PressableScale
      accessibilityRole="link"
      onPress={() =>
        router.push({ pathname: '/patients/[patientId]', params: { patientId: patient.id } })
      }
      className={cn('flex-row items-center gap-3 py-4', !isFirst && 'border-t border-border')}
    >
      <View className="flex-1 gap-1">
        <Text variant="label" className="text-base">
          {patient.fullName}
        </Text>
        <Text
          variant="caption"
          className={cn((patient.missed > 0 || patient.openIncidents > 0) && 'text-danger')}
        >
          {facts.join(' · ')}
        </Text>
      </View>
      {patient.latestWellbeing && <Badge tone={WELLBEING_DETAILS[patient.latestWellbeing]} />}
    </PressableScale>
  );
}
