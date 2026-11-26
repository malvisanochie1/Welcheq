import { Router } from 'express';

import { writeRateLimit } from '@/middleware/rate-limit';
import { reviewController } from './review.controller';

export const caregiverRouter = Router({ mergeParams: true });

caregiverRouter.get('/:caregiverId', reviewController.profile);
caregiverRouter.put('/:caregiverId/review', writeRateLimit, reviewController.review);
