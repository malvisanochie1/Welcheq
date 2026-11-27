import { Router } from 'express';

import { demoSessionRateLimit } from '@/middleware/rate-limit';
import { demoController } from './demo.controller';

export const demoRouter = Router();

demoRouter.post('/session', demoSessionRateLimit, demoController.startSession);
