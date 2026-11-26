import { Router } from 'express';

import { writeRateLimit } from '@/middleware/rate-limit';
import { incidentController } from './incident.controller';

export const incidentRouter = Router({ mergeParams: true });

incidentRouter.get('/', incidentController.list);
incidentRouter.post('/', writeRateLimit, incidentController.report);
incidentRouter.post('/:incidentId/resolve', writeRateLimit, incidentController.resolve);
