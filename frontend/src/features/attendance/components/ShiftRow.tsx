import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';
import { formatDay, formatTime } from '@/lib/format-date';
import type { Shift } from '../api/attendance.api';
import { ShiftStatusChip } from './ShiftStatusChip';
import { SelfieViewer } from './SelfieViewer';
import { VisitEvidence } from './VisitEvidence';

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

      {visit && <VisitEvidence visit={visit} />}
      {visit?.hasSelfie && (
        <SelfieViewer patientId={shift.patientId} visitId={visit.id} takenAt={visit.checkInAt} />
      )}

      {onCancel && (
        <View className="self-start">
          <Button label="Cancel visit" variant="ghost" onPress={onCancel} />
        </View>
      )}
    </View>
  );
}
