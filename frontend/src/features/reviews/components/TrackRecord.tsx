import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { CaregiverProfile } from '../api/reviews.api';

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View className="min-w-[45%] flex-1 gap-1 rounded-md bg-surface-muted p-3">
      <Text variant="title">{value}</Text>
      <Text variant="caption">{label}</Text>
    </View>
  );
}

export function TrackRecord({ record }: { record: CaregiverProfile['trackRecord'] }) {
  return (
    <View className="gap-3">
      <Text variant="heading">Last {record.days} days</Text>
      <View className="flex-row flex-wrap gap-3">
        <Stat value={record.visits} label="Visits completed" />
        <Stat value={record.late} label="Arrived late" />
        <Stat value={record.earlyDepartures} label="Left early" />
        <Stat value={record.missed} label="Missed visits" />
      </View>
    </View>
  );
}
