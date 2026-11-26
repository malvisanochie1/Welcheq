import type { ChecklistStatus } from '@welcheq/shared';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { STATUS_DETAILS } from '@/config/care-plan';
import { cn } from '@/lib/cn';

export interface StatusChipProps {
  status: ChecklistStatus;
}

export function StatusChip({ status }: StatusChipProps) {
  const details = STATUS_DETAILS[status];
  return (
    <View className={cn('shrink-0 rounded-full px-3 py-1', details.containerClassName)}>
      <Text variant="label" className={cn('text-xs', details.textClassName)}>
        {details.label}
      </Text>
    </View>
  );
}
