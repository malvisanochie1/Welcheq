import { SHIFT_STATUS } from '@welcheq/shared';
import { View } from 'react-native';

import type { Shift } from '../api/attendance.api';
import { ShiftRow } from './ShiftRow';

const CANCELLABLE: readonly string[] = [SHIFT_STATUS.SCHEDULED];

export interface ShiftListProps {
  shifts: Shift[];
  titleFor: (shift: Shift) => string;
  onCancel?: (shift: Shift) => void;
}

export function ShiftList({ shifts, titleFor, onCancel }: ShiftListProps) {
  return (
    <View className="rounded-lg border border-border bg-surface px-4">
      {shifts.map((shift, index) => (
        <ShiftRow
          key={shift.id}
          shift={shift}
          isFirst={index === 0}
          title={titleFor(shift)}
          onCancel={
            onCancel && CANCELLABLE.includes(shift.status) ? () => onCancel(shift) : undefined
          }
        />
      ))}
    </View>
  );
}
