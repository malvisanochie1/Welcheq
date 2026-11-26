import { Router } from 'express';

import { writeRateLimit } from '@/middleware/rate-limit';
import { healthProfileController as controller } from './health-profile.controller';

export const healthProfileRouter = Router({ mergeParams: true });

healthProfileRouter.get('/', controller.profile);

healthProfileRouter.post('/medications', writeRateLimit, controller.addMedication);
healthProfileRouter.put('/medications/:entryId', writeRateLimit, controller.updateMedication);
healthProfileRouter.post('/medications/:entryId/stop', writeRateLimit, controller.stopMedication);

healthProfileRouter.post('/allergies', writeRateLimit, controller.addAllergy);
healthProfileRouter.put('/allergies/:entryId', writeRateLimit, controller.updateAllergy);
healthProfileRouter.delete('/allergies/:entryId', writeRateLimit, controller.removeAllergy);

healthProfileRouter.post('/conditions', writeRateLimit, controller.addCondition);
healthProfileRouter.put('/conditions/:entryId', writeRateLimit, controller.updateCondition);
healthProfileRouter.delete('/conditions/:entryId', writeRateLimit, controller.removeCondition);

healthProfileRouter.get('/documents', controller.documents);
healthProfileRouter.post('/documents/upload', writeRateLimit, controller.requestDocumentUpload);
healthProfileRouter.post('/documents', writeRateLimit, controller.addDocument);
healthProfileRouter.get('/documents/:entryId', controller.viewDocument);
healthProfileRouter.delete('/documents/:entryId', writeRateLimit, controller.removeDocument);
