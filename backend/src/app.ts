import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { env } from '@/config/env';
import { REQUEST_LIMITS } from '@/config/security';
import { logger } from '@/lib/logger';
import { errorHandler, notFoundHandler } from '@/middleware/error-handler';
import { globalRateLimit } from '@/middleware/rate-limit';
import { myAttendanceRouter } from '@/modules/attendance/attendance.routes';
import { homeDisplayRouter } from '@/modules/home-display/home-display.routes';
import { capabilitiesRouter } from '@/modules/health/capabilities.routes';
import { healthRouter } from '@/modules/health/health.routes';
import { invitationRouter } from '@/modules/invitations/invitation.routes';
import { notificationRouter } from '@/modules/notifications/notification.routes';
import { patientRouter } from '@/modules/patients/patient.routes';
import { profileRouter } from '@/modules/profile/profile.routes';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: false, maxAge: 600 }));
  app.use(pinoHttp({ logger }));
  app.use(globalRateLimit);
  app.use(express.json({ limit: REQUEST_LIMITS.JSON_BODY, strict: true }));

  app.use('/health', healthRouter);
  app.use('/v1/capabilities', capabilitiesRouter);
  app.use('/v1/me', myAttendanceRouter);
  app.use('/v1/me', profileRouter);
  app.use('/v1/patients', patientRouter);
  app.use('/v1/invitations', invitationRouter);
  app.use('/v1/home-display', homeDisplayRouter);
  app.use('/v1/notifications', notificationRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
