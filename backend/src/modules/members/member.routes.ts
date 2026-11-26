import { Router } from 'express';

import { writeRateLimit } from '@/middleware/rate-limit';
import { memberController } from './member.controller';

export const patientMemberRouter = Router({ mergeParams: true });

patientMemberRouter.get('/', memberController.list);
patientMemberRouter.delete('/:userId', writeRateLimit, memberController.remove);
