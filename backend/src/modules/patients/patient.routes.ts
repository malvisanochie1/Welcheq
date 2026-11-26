import { Router } from 'express';

import { authenticate } from '@/middleware/authenticate';
import { writeRateLimit } from '@/middleware/rate-limit';
import { requireProfile } from '@/middleware/require-profile';
import { careTaskRouter, checklistRouter } from '@/modules/care-plan/care-plan.routes';
import { patientInvitationRouter } from '@/modules/invitations/invitation.routes';
import { patientMemberRouter } from '@/modules/members/member.routes';
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
patientRouter.use('/:patientId/invitations', patientInvitationRouter);
patientRouter.use('/:patientId/members', patientMemberRouter);
patientRouter.use('/:patientId/care-tasks', careTaskRouter);
patientRouter.use('/:patientId/checklist', checklistRouter);
