import { Switch, View } from 'react-native';

import { palette } from '@/theme';
import { Text } from './Text';

export interface SwitchRowProps {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isDisabled?: boolean;
}

export function SwitchRow({
  title,
  description,
  value,
  onValueChange,
  isDisabled = false,
}: SwitchRowProps) {
  return (
    <View className="min-h-12 flex-row items-center gap-4">
      <View className="flex-1 gap-1">
        <Text variant="label" className="text-base">
          {title}
        </Text>
        {description && <Text variant="caption">{description}</Text>}
      </View>
      <Switch
        accessibilityLabel={title}
        accessibilityHint={description}
        value={value}
        onValueChange={onValueChange}
        disabled={isDisabled}
        trackColor={{ false: palette.border, true: palette.primary }}
        thumbColor={palette.surface}
      />
    </View>
  );
}
