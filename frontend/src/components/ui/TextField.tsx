import { useState, type ReactNode } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { cn } from '@/lib/cn';
import { usePalette } from '@/features/accessibility/hooks/use-palette';
import { Text } from './Text';

export interface TextFieldProps extends Omit<TextInputProps, 'className'> {
  label: string;
  errorMessage?: string;
  trailing?: ReactNode;
  className?: string;
}

export function TextField({
  label,
  errorMessage,
  trailing,
  className,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const palette = usePalette();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={cn('gap-2', className)}>
      <Text variant="label">{label}</Text>
      <View
        className={cn(
          'min-h-12 flex-row items-center rounded-md border bg-surface px-4',
          isFocused ? 'border-primary' : 'border-border',
          errorMessage && 'border-danger',
        )}
      >
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={palette['ink-subtle']}
          className="flex-1 py-3 font-body text-base text-ink"
          style={{ minWidth: 0, outlineWidth: 0 }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          {...inputProps}
        />
        {trailing && <View className="shrink-0 pl-2">{trailing}</View>}
      </View>
      {errorMessage && (
        <Text variant="caption" className="text-danger" accessibilityLiveRegion="polite">
          {errorMessage}
        </Text>
      )}
    </View>
  );
}
