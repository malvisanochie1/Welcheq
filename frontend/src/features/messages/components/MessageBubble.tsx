import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';
import { formatDay, formatTime } from '@/lib/format-date';
import type { CareTeamMessage } from '../api/messages.api';

export interface MessageBubbleProps {
  message: CareTeamMessage;
  isOwn: boolean;
  showAuthor: boolean;
}

export function MessageBubble({ message, isOwn, showAuthor }: MessageBubbleProps) {
  return (
    <View className={cn('max-w-[85%] gap-1', isOwn ? 'items-end self-end' : 'self-start')}>
      {showAuthor && !isOwn && <Text variant="caption">{message.author.fullName}</Text>}
      <View
        className={cn(
          'rounded-lg px-4 py-3',
          isOwn ? 'bg-primary' : 'border border-border bg-surface',
        )}
      >
        <Text variant="body" className={isOwn ? 'text-on-primary' : undefined}>
          {message.body}
        </Text>
      </View>
      <Text variant="caption">
        {formatDay(message.createdAt)} · {formatTime(message.createdAt)}
      </Text>
    </View>
  );
}
