import { Router } from 'express';

import { authenticate } from '@/middleware/authenticate';
import { invitationAcceptRateLimit, writeRateLimit } from '@/middleware/rate-limit';
import { requireProfile } from '@/middleware/require-profile';
import { invitationController } from './invitation.controller';

export const patientInvitationRouter = Router({ mergeParams: true });

patientInvitationRouter.get('/', invitationController.listPending);
patientInvitationRouter.post('/', writeRateLimit, invitationController.create);
patientInvitationRouter.delete('/:invitationId', writeRateLimit, invitationController.revoke);

export const invitationRouter = Router();

invitationRouter.use(authenticate, requireProfile);
invitationRouter.post('/accept', invitationAcceptRateLimit, invitationController.accept);
