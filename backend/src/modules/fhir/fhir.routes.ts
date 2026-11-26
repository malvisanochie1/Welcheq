import { idSchema } from '@welcheq/shared';
import { Router, type RequestHandler } from 'express';

import { writeRateLimit } from '@/middleware/rate-limit';
import { requireActingUser } from '@/middleware/require-profile';
import { fhirService } from './fhir.service';

const exportRecord: RequestHandler = async (req, res) => {
  const bundle = await fhirService.exportRecord(
    requireActingUser(req.actingUser),
    idSchema.parse(req.params.patientId),
  );
  res.json({ data: bundle });
};

export const fhirRouter = Router({ mergeParams: true });

fhirRouter.get('/', writeRateLimit, exportRecord);
