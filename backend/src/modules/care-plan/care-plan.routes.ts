import { Router } from 'express';

import { writeRateLimit } from '@/middleware/rate-limit';
import { carePlanController } from './care-plan.controller';

export const careTaskRouter = Router({ mergeParams: true });

careTaskRouter.get('/', carePlanController.listTasks);
careTaskRouter.post('/', writeRateLimit, carePlanController.addTask);
careTaskRouter.post('/from-template', writeRateLimit, carePlanController.applyTemplate);
careTaskRouter.patch('/:taskId', writeRateLimit, carePlanController.updateTask);
careTaskRouter.delete('/:taskId', writeRateLimit, carePlanController.removeTask);

export const checklistRouter = Router({ mergeParams: true });

checklistRouter.get('/', carePlanController.checklist);
checklistRouter.put('/:taskId', carePlanController.recordTask);
