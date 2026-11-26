import { Router } from 'express';

import { authenticate } from '@/middleware/authenticate';
import { writeRateLimit } from '@/middleware/rate-limit';
import { requireProfile } from '@/middleware/require-profile';
import { notificationController } from './notification.controller';

export const notificationRouter = Router();

notificationRouter.use(authenticate, requireProfile);
notificationRouter.get('/', notificationController.list);
notificationRouter.get('/unread-count', notificationController.unreadCount);
notificationRouter.post('/read', writeRateLimit, notificationController.markRead);
