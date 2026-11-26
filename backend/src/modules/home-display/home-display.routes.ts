import { Router } from 'express';

import { homeDisplayPairRateLimit, writeRateLimit } from '@/middleware/rate-limit';
import { homeDisplayController } from './home-display.controller';

export const patientHomeDisplayRouter = Router({ mergeParams: true });

patientHomeDisplayRouter.post('/pairing', writeRateLimit, homeDisplayController.createPairing);
patientHomeDisplayRouter.post('/reset', writeRateLimit, homeDisplayController.reset);

/** Used by a spare device at the home that has no account; protected by single-use codes. */
export const homeDisplayRouter = Router();

homeDisplayRouter.post('/pair', homeDisplayPairRateLimit, homeDisplayController.pair);
