import { Router } from 'express';

import { authenticate } from '@/middleware/authenticate';
import { requireProfile } from '@/middleware/require-profile';
import { dashboardController } from './dashboard.controller';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate, requireProfile);
dashboardRouter.get('/', dashboardController.overview);
