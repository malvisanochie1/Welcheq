import { AlertTriangle } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { ATTENDANCE_FLAG_LABELS } from '@/config/attendance';
import { cn } from '@/lib/cn';
import { formatDay, formatTime } from '@/lib/format-date';
import { palette } from '@/theme';
import type { Shift } from '../api/attendance.api';
import { ShiftStatusChip } from './ShiftStatusChip';

const ICON_SIZE = 14;

export interface ShiftRowProps {
  shift: Shift;
  isFirst: boolean;
  title: string;
  onCancel?: () => void;
}

export function ShiftRow({ shift, isFirst, title, onCancel }: ShiftRowProps) {
  const { visit } = shift;
  const actual = visit
    ? `Arrived ${formatTime(visit.checkInAt)}${visit.checkOutAt ? ` · left ${formatTime(visit.checkOutAt)}` : ''}`
    : null;

  return (
    <View className={cn('gap-2 py-4', !isFirst && 'border-t border-border')}>
      <View className="flex-row items-start gap-3">
        <View className="flex-1 gap-1">
          <Text variant="caption">
            {formatDay(shift.startsAt)} · {formatTime(shift.startsAt)}–{formatTime(shift.endsAt)}
          </Text>
          <Text variant="label" className="text-base">
            {title}
          </Text>
          {actual && <Text variant="caption">{actual}</Text>}
        </View>
        <ShiftStatusChip status={shift.status} />
      </View>

      {visit && visit.flags.length > 0 && (
        <View className="gap-1">
          {visit.flags.map((flag) => (
            <View key={flag} className="flex-row items-center gap-2">
              <AlertTriangle size={ICON_SIZE} color={palette.warning} />
              <Text variant="caption" className="text-warning">
                {ATTENDANCE_FLAG_LABELS[flag]}
              </Text>
            </View>
          ))}
        </View>
      )}

      {onCancel && (
        <View className="self-start">
          <Button label="Cancel visit" variant="ghost" onPress={onCancel} />
        </View>
      )}
    </View>
  );
}
