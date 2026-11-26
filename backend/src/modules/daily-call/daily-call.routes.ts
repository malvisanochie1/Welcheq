import { Router } from 'express';

import { writeRateLimit } from '@/middleware/rate-limit';
import { dailyCallController } from './daily-call.controller';

export const dailyCallRouter = Router({ mergeParams: true });

dailyCallRouter.get('/', dailyCallController.prepare);
dailyCallRouter.get('/history', dailyCallController.history);
dailyCallRouter.post('/', writeRateLimit, dailyCallController.record);
