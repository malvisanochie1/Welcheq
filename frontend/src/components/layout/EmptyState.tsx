import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

export interface EmptyStateProps {
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <View className="items-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-10">
      <Text variant="heading" className="text-center">
        {title}
      </Text>
      <Text variant="body" className="text-center text-ink-muted">
        {message}
      </Text>
      {action && <View className="mt-3 w-full">{action}</View>}
    </View>
  );
}
