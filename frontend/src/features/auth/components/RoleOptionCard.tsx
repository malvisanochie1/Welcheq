import { View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import type { RoleOption } from '@/config/roles';
import { cn } from '@/lib/cn';

export interface RoleOptionCardProps {
  option: RoleOption;
  isSelected: boolean;
  onSelect: () => void;
}

export function RoleOptionCard({ option, isSelected, onSelect }: RoleOptionCardProps) {
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={option.title}
      accessibilityHint={option.description}
      onPress={onSelect}
      className={cn(
        'flex-row items-center gap-4 rounded-lg border-2 bg-surface p-4',
        isSelected ? 'border-primary' : 'border-border',
      )}
    >
      <View
        className={cn(
          'h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
          isSelected ? 'border-primary' : 'border-ink-subtle',
        )}
      >
        {isSelected && <View className="h-2.5 w-2.5 rounded-full bg-primary" />}
      </View>
      <View className="flex-1 gap-1">
        <Text variant="heading" className="text-base">
          {option.title}
        </Text>
        <Text variant="caption">{option.description}</Text>
      </View>
    </PressableScale>
  );
}
