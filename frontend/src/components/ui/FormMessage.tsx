import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { Text } from './Text';

const TONE_CLASSES = {
  error: { container: 'bg-danger-soft', text: 'text-danger' },
  info: { container: 'bg-primary-soft', text: 'text-primary' },
} as const;

export interface FormMessageProps {
  message: string;
  tone?: keyof typeof TONE_CLASSES;
}

export function FormMessage({ message, tone = 'error' }: FormMessageProps) {
  const classes = TONE_CLASSES[tone];

  return (
    <View
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      className={cn('rounded-md px-4 py-3', classes.container)}
    >
      <Text variant="label" className={classes.text}>
        {message}
      </Text>
    </View>
  );
}
