import { Router } from 'express';

import { writeRateLimit } from '@/middleware/rate-limit';
import { healthRecordController } from './health-record.controller';

export const readingRouter = Router({ mergeParams: true });

readingRouter.get('/', healthRecordController.listReadings);
readingRouter.post('/', writeRateLimit, healthRecordController.addReading);
