import type { ShiftStatus } from '@welcheq/shared';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { SHIFT_STATUS_DETAILS } from '@/config/attendance';
import { cn } from '@/lib/cn';

export function ShiftStatusChip({ status }: { status: ShiftStatus }) {
  const details = SHIFT_STATUS_DETAILS[status];
  return (
    <View className={cn('shrink-0 rounded-full px-3 py-1', details.containerClassName)}>
      <Text variant="label" className={cn('text-xs', details.textClassName)}>
        {details.label}
      </Text>
    </View>
  );
}
