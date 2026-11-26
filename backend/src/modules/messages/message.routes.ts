import { Router } from 'express';

import { writeRateLimit } from '@/middleware/rate-limit';
import { messageController } from './message.controller';

export const messageRouter = Router({ mergeParams: true });

messageRouter.get('/', messageController.list);
messageRouter.post('/', writeRateLimit, messageController.send);
