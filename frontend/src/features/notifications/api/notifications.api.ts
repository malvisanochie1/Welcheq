import type { NotificationKind } from '@welcheq/shared';

import { apiRequest } from '@/lib/api-client';

export interface AppNotification {
  id: string;
  patientId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationInbox {
  notifications: AppNotification[];
  unreadCount: number;
}

export const notificationsApi = {
  inbox: () => apiRequest<NotificationInbox>('/v1/notifications'),
  unreadCount: () => apiRequest<{ unreadCount: number }>('/v1/notifications/unread-count'),
  markRead: (ids: string[] | 'all') =>
    apiRequest<void>('/v1/notifications/read', {
      method: 'POST',
      body: ids === 'all' ? { all: true } : { ids },
    }),
};
