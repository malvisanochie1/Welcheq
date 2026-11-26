import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Screen } from './Screen';

export interface ErrorStateProps {
  title: string;
  message: string;
  onRetry: () => void;
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <Screen isScrollable={false} contentClassName="justify-center gap-6">
      <View className="gap-2">
        <Text variant="title">{title}</Text>
        <Text variant="body" className="text-ink-muted">
          {message}
        </Text>
      </View>
      <Button label="Try again" onPress={onRetry} />
    </Screen>
  );
}
