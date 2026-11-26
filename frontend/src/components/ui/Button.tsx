import { ActivityIndicator, View } from 'react-native';

import { usePalette } from '@/features/accessibility/hooks/use-palette';
import { cn } from '@/lib/cn';
import type { PaletteName } from '@/theme';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

const VARIANT_STYLES = {
  primary: { container: 'bg-primary', label: 'text-on-primary', spinner: 'on-primary' },
  secondary: { container: 'border border-border bg-surface', label: 'text-ink', spinner: 'ink' },
  ghost: { container: 'bg-transparent', label: 'text-primary', spinner: 'primary' },
} as const satisfies Record<string, { container: string; label: string; spinner: PaletteName }>;

export type ButtonVariant = keyof typeof VARIANT_STYLES;

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  isLoading?: boolean;
  isDisabled?: boolean;
  accessibilityHint?: string;
  className?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  isLoading = false,
  isDisabled = false,
  accessibilityHint,
  className,
}: ButtonProps) {
  const palette = usePalette();
  const styles = VARIANT_STYLES[variant];
  const isInactive = isDisabled || isLoading;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isInactive, busy: isLoading }}
      disabled={isInactive}
      onPress={onPress}
      className={cn(
        'min-h-12 items-center justify-center rounded-md px-6',
        styles.container,
        isInactive && 'opacity-60',
        className,
      )}
    >
      <View className="flex-row items-center gap-2">
        {isLoading && <ActivityIndicator size="small" color={palette[styles.spinner]} />}
        <Text variant="label" className={cn('text-base', styles.label)}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}
