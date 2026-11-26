import { Router } from 'express';

import { authenticate } from '@/middleware/authenticate';
import { writeRateLimit } from '@/middleware/rate-limit';
import { requireProfile } from '@/middleware/require-profile';
import { patientController } from './patient.controller';

export const patientRouter = Router();

patientRouter.use(authenticate, requireProfile);

patientRouter.get('/', patientController.list);
patientRouter.post('/', writeRateLimit, patientController.create);
patientRouter.get('/:patientId', patientController.get);
patientRouter.patch('/:patientId', writeRateLimit, patientController.update);
patientRouter.put(
  '/:patientId/proof-settings',
  writeRateLimit,
  patientController.updateProofSettings,
);
