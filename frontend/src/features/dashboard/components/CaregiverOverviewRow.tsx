import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';
import type { DashboardOverview } from '../api/dashboard.api';
import { formatRate } from '../lib/format-rate';

export interface CaregiverOverviewRowProps {
  caregiver: DashboardOverview['caregivers'][number];
  isFirst: boolean;
}

export function CaregiverOverviewRow({ caregiver, isFirst }: CaregiverOverviewRowProps) {
  const facts = [
    `${caregiver.completed} visits`,
    `${formatRate(caregiver.onTimeRate)} on time`,
    caregiver.missed > 0 ? `${caregiver.missed} missed` : null,
  ].filter(Boolean);

  return (
    <View className={cn('flex-row items-center gap-3 py-4', !isFirst && 'border-t border-border')}>
      <View className="flex-1 gap-1">
        <Text variant="label" className="text-base">
          {caregiver.fullName}
        </Text>
        <Text variant="caption" className={cn(caregiver.missed > 0 && 'text-danger')}>
          {facts.join(' · ')}
        </Text>
      </View>
      <Text variant="label">
        {caregiver.averageRating === null ? 'Not rated' : `★ ${caregiver.averageRating.toFixed(1)}`}
      </Text>
    </View>
  );
}
