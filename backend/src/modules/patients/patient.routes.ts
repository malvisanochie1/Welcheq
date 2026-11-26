import { Router } from 'express';

import { authenticate } from '@/middleware/authenticate';
import { writeRateLimit } from '@/middleware/rate-limit';
import { requireProfile } from '@/middleware/require-profile';
import { shiftRouter, visitRouter } from '@/modules/attendance/attendance.routes';
import { dailyCallController } from '@/modules/daily-call/daily-call.controller';
import { dailyCallRouter } from '@/modules/daily-call/daily-call.routes';
import { readingRouter } from '@/modules/health-records/reading.routes';
import { incidentRouter } from '@/modules/incidents/incident.routes';
import { patientHomeDisplayRouter } from '@/modules/home-display/home-display.routes';
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
patientRouter.use('/:patientId/shifts', shiftRouter);
patientRouter.use('/:patientId/visits', visitRouter);
patientRouter.use('/:patientId/home-display', patientHomeDisplayRouter);
patientRouter.put('/:patientId/contact', writeRateLimit, dailyCallController.updateContact);
patientRouter.use('/:patientId/daily-call', dailyCallRouter);
patientRouter.use('/:patientId/readings', readingRouter);
patientRouter.use('/:patientId/incidents', incidentRouter);
