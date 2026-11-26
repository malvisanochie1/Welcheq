import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';

export interface StatTileProps {
  value: string;
  label: string;
  isWarning?: boolean;
}

export function StatTile({ value, label, isWarning = false }: StatTileProps) {
  return (
    <View className="min-w-[45%] flex-1 gap-1 rounded-lg border border-border bg-surface p-4">
      <Text variant="display" className={cn(isWarning && 'text-danger')}>
        {value}
      </Text>
      <Text variant="caption">{label}</Text>
    </View>
  );
}
