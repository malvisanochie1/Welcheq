import { Router } from 'express';

import { authenticate } from '@/middleware/authenticate';
import { writeRateLimit } from '@/middleware/rate-limit';
import { requireProfile } from '@/middleware/require-profile';
import { healthRecordController } from '@/modules/health-records/health-record.controller';
import { attendanceController } from './attendance.controller';

export const shiftRouter = Router({ mergeParams: true });

shiftRouter.get('/', attendanceController.listShifts);
shiftRouter.post('/', writeRateLimit, attendanceController.scheduleShifts);
shiftRouter.delete('/:shiftId', writeRateLimit, attendanceController.cancelShift);

export const visitRouter = Router({ mergeParams: true });

visitRouter.get('/', attendanceController.listVisits);
visitRouter.post('/check-in', writeRateLimit, attendanceController.checkIn);
visitRouter.post('/selfie-upload', writeRateLimit, attendanceController.requestSelfieUpload);
visitRouter.get('/:visitId/selfie', attendanceController.viewSelfie);
visitRouter.get('/:visitId/report', healthRecordController.visitReport);
visitRouter.put('/:visitId/report', writeRateLimit, healthRecordController.saveVisitReport);
visitRouter.post('/:visitId/check-out', writeRateLimit, attendanceController.checkOut);
visitRouter.post(
  '/:visitId/surprise-check',
  writeRateLimit,
  attendanceController.answerSurpriseCheck,
);

export const myAttendanceRouter = Router();

myAttendanceRouter.get('/shifts', authenticate, requireProfile, attendanceController.myShifts);
myAttendanceRouter.get(
  '/visits/open',
  authenticate,
  requireProfile,
  attendanceController.myOpenVisit,
);
