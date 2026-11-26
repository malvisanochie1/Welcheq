import { markNotificationsReadSchema } from '@welcheq/shared';
import type { RequestHandler } from 'express';

import { requireActingUser } from '@/middleware/require-profile';
import { notificationService } from './notification.service';

export const notificationController = {
  list: (async (req, res) => {
    res.json({ data: await notificationService.list(requireActingUser(req.actingUser)) });
  }) satisfies RequestHandler,

  unreadCount: (async (req, res) => {
    const count = await notificationService.unreadCount(requireActingUser(req.actingUser));
    res.json({ data: { unreadCount: count } });
  }) satisfies RequestHandler,

  markRead: (async (req, res) => {
    const input = markNotificationsReadSchema.parse(req.body);
    await notificationService.markRead(
      requireActingUser(req.actingUser),
      'all' in input ? 'all' : input.ids,
    );
    res.status(204).end();
  }) satisfies RequestHandler,
};
