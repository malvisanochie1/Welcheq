import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { usePalette } from '@/features/accessibility/hooks/use-palette';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

const ICON_SIZE = 20;

export interface LinkCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  accessory?: ReactNode;
  onPress: () => void;
}

export function LinkCard({ icon: Icon, title, subtitle, accessory, onPress }: LinkCardProps) {
  const palette = usePalette();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      onPress={onPress}
      className="flex-row items-center gap-4 rounded-lg border border-border bg-surface p-4"
    >
      <View className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft">
        <Icon size={ICON_SIZE} color={palette.primary} />
      </View>
      <View className="flex-1 gap-1">
        <Text variant="heading" className="text-base">
          {title}
        </Text>
        {subtitle && <Text variant="caption">{subtitle}</Text>}
      </View>
      {accessory}
      <ChevronRight size={ICON_SIZE} color={palette['ink-subtle']} />
    </PressableScale>
  );
}
