import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { Text } from './Text';

export interface BadgeTone {
  label: string;
  containerClassName: string;
  textClassName: string;
}

export function Badge({ tone }: { tone: BadgeTone }) {
  return (
    <View className={cn('shrink-0 rounded-full px-3 py-1', tone.containerClassName)}>
      <Text variant="label" className={cn('text-xs', tone.textClassName)}>
        {tone.label}
      </Text>
    </View>
  );
}
