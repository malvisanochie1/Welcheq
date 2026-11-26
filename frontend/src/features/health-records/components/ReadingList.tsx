import { View } from 'react-native';

import type { Reading } from '../api/health-records.api';
import { ReadingRow } from './ReadingRow';

export interface ReadingListProps {
  readings: Reading[];
  showDay?: boolean;
}

export function ReadingList({ readings, showDay }: ReadingListProps) {
  return (
    <View className="rounded-lg border border-border bg-surface px-4">
      {readings.map((reading, index) => (
        <ReadingRow key={reading.id} reading={reading} isFirst={index === 0} showDay={showDay} />
      ))}
    </View>
  );
}
