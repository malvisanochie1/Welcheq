import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { usePalette } from '@/features/accessibility/hooks/use-palette';
import { touchTarget } from '@/theme';

const ICON_SIZE = 22;

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  canGoBack?: boolean;
  action?: ReactNode;
}

export function ScreenHeader({ title, subtitle, canGoBack = false, action }: ScreenHeaderProps) {
  const palette = usePalette();
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        {canGoBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
            className="-ml-3 items-center justify-center"
            style={{ minWidth: touchTarget.min, minHeight: touchTarget.min }}
          >
            <ArrowLeft size={ICON_SIZE} color={palette.ink} />
          </Pressable>
        ) : (
          <View />
        )}
        {action}
      </View>
      <View className="gap-1">
        <Text variant="title">{title}</Text>
        {subtitle && <Text variant="caption">{subtitle}</Text>}
      </View>
    </View>
  );
}
