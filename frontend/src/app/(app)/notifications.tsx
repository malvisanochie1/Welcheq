import { router } from 'expo-router';
import { View } from 'react-native';

import { EmptyState } from '@/components/layout/EmptyState';
import { ErrorState } from '@/components/layout/ErrorState';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import type { AppNotification } from '@/features/notifications/api/notifications.api';
import { NotificationRow } from '@/features/notifications/components/NotificationRow';
import {
  useMarkNotificationsRead,
  useNotificationInbox,
} from '@/features/notifications/hooks/use-notifications';
import { notificationTarget } from '@/features/notifications/lib/notification-target';
import { useIsWideLayout } from '@/hooks/use-is-wide-layout';

const SKELETON_HEIGHT = 320;

export default function NotificationsScreen() {
  const inbox = useNotificationInbox();
  const markRead = useMarkNotificationsRead();
  const isWide = useIsWideLayout();

  if (inbox.isError) {
    return (
      <ErrorState
        title="We couldn't load notifications"
        message={inbox.error.message}
        onRetry={() => inbox.refetch()}
      />
    );
  }

  const open = (notification: AppNotification) => {
    if (!notification.readAt) markRead.mutate([notification.id]);
    router.push(notificationTarget(notification));
  };

  return (
    <Screen isWide={isWide} contentClassName="gap-6">
      <ScreenHeader
        canGoBack={!isWide}
        title="Notifications"
        subtitle="Arrivals, reports, incidents and anything that needs you"
        action={
          inbox.data && inbox.data.unreadCount > 0 ? (
            <Button label="Mark all read" variant="ghost" onPress={() => markRead.mutate('all')} />
          ) : undefined
        }
      />
      {!inbox.data ? (
        <Skeleton height={SKELETON_HEIGHT} />
      ) : inbox.data.notifications.length === 0 ? (
        <EmptyState
          title="All quiet"
          message="You'll see arrivals, visit reports and incidents here as they happen."
        />
      ) : (
        <View className="rounded-lg border border-border bg-surface px-4">
          {inbox.data.notifications.map((notification, index) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              isFirst={index === 0}
              onPress={() => open(notification)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
