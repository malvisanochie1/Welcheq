import { View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';
import { formatDay, formatTime } from '@/lib/format-date';
import type { AppNotification } from '../api/notifications.api';

export interface NotificationRowProps {
  notification: AppNotification;
  isFirst: boolean;
  onPress: () => void;
}

export function NotificationRow({ notification, isFirst, onPress }: NotificationRowProps) {
  const isUnread = notification.readAt === null;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${isUnread ? 'Unread: ' : ''}${notification.title}. ${notification.body}`}
      onPress={onPress}
      className={cn('flex-row gap-3 py-4', !isFirst && 'border-t border-border')}
    >
      <View
        className={cn(
          'mt-2 h-2 w-2 shrink-0 rounded-full',
          isUnread ? 'bg-primary' : 'bg-transparent',
        )}
      />
      <View className="flex-1 gap-1">
        <Text variant="label" className={cn('text-base', !isUnread && 'text-ink-muted')}>
          {notification.title}
        </Text>
        <Text variant="body" className="text-ink-muted">
          {notification.body}
        </Text>
        <Text variant="caption">
          {formatDay(notification.createdAt)} · {formatTime(notification.createdAt)}
        </Text>
      </View>
    </PressableScale>
  );
}
