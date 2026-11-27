import { Router } from 'express';

import { authenticate } from '@/middleware/authenticate';
import { writeRateLimit } from '@/middleware/rate-limit';
import { profileController } from './profile.controller';

export const profileRouter = Router();

profileRouter.use(authenticate);

profileRouter.get('/', profileController.getOwn);
profileRouter.post('/', writeRateLimit, profileController.complete);
profileRouter.patch('/', writeRateLimit, profileController.updateOwn);
profileRouter.delete('/', writeRateLimit, profileController.deleteOwn);
