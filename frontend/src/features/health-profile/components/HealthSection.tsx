import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

export interface HealthSectionProps {
  title: string;
  emptyMessage: string;
  isEmpty: boolean;
  addLabel?: string;
  onAdd?: () => void;
  form?: ReactNode;
  children?: ReactNode;
}

export function HealthSection({
  title,
  emptyMessage,
  isEmpty,
  addLabel,
  onAdd,
  form,
  children,
}: HealthSectionProps) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <Text variant="heading" className="flex-1">
          {title}
        </Text>
        {onAdd && addLabel && !form && <Button label={addLabel} variant="ghost" onPress={onAdd} />}
      </View>
      {form}
      {isEmpty && !form ? (
        <Text variant="body" className="text-ink-muted">
          {emptyMessage}
        </Text>
      ) : (
        !isEmpty && (
          <View className="rounded-lg border border-border bg-surface px-4">{children}</View>
        )
      )}
    </View>
  );
}
