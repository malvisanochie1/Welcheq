import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { READING_DETAILS, READING_SOURCE_LABELS } from '@/config/health-records';
import { cn } from '@/lib/cn';
import { formatDay, formatTime } from '@/lib/format-date';
import type { Reading } from '../api/health-records.api';
import { formatReadingValue } from '../lib/reading-draft';

export interface ReadingRowProps {
  reading: Reading;
  isFirst: boolean;
  showDay?: boolean;
}

export function ReadingRow({ reading, isFirst, showDay = true }: ReadingRowProps) {
  const when = showDay
    ? `${formatDay(reading.measuredAt)} · ${formatTime(reading.measuredAt)}`
    : formatTime(reading.measuredAt);

  return (
    <View className={cn('flex-row items-center gap-3 py-3', !isFirst && 'border-t border-border')}>
      <View className="flex-1 gap-1">
        <Text variant="label" className="text-base">
          {READING_DETAILS[reading.type].label}
        </Text>
        <Text variant="caption">
          {when} · {READING_SOURCE_LABELS[reading.source]}: {reading.recordedBy}
        </Text>
      </View>
      <Text variant="label" className="text-base">
        {formatReadingValue(reading)}
      </Text>
    </View>
  );
}
