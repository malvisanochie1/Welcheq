import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { notificationsApi } from '../api/notifications.api';

const NOTIFICATIONS_KEY = ['notifications'] as const;
const REFRESH_MS = 60_000;

export function useNotificationInbox() {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, 'inbox'],
    queryFn: notificationsApi.inbox,
    refetchInterval: REFRESH_MS,
  });
}

export function useUnreadNotificationCount(isEnabled = true) {
  const count = useQuery({
    queryKey: [...NOTIFICATIONS_KEY, 'unread'],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: REFRESH_MS,
    enabled: isEnabled,
  });
  return count.data?.unreadCount ?? 0;
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}
