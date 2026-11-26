import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';

export interface EntryRowProps {
  title: string;
  details: Array<string | null>;
  isFirst: boolean;
  accessory?: ReactNode;
  actions?: ReactNode;
  isMuted?: boolean;
}

export function EntryRow({ title, details, isFirst, accessory, actions, isMuted }: EntryRowProps) {
  const lines = details.filter((line): line is string => Boolean(line));

  return (
    <View
      className={cn('gap-2 py-4', !isFirst && 'border-t border-border', isMuted && 'opacity-70')}
    >
      <View className="flex-row items-start gap-3">
        <View className="flex-1 gap-1">
          <Text variant="label" className="text-base">
            {title}
          </Text>
          {lines.map((line) => (
            <Text key={line} variant="caption">
              {line}
            </Text>
          ))}
        </View>
        {accessory}
      </View>
      {actions && <View className="self-start">{actions}</View>}
    </View>
  );
}
