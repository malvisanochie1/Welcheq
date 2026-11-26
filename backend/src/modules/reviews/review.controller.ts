import { idSchema, reviewInputSchema } from '@welcheq/shared';
import type { Request, RequestHandler } from 'express';

import { requireActingUser } from '@/middleware/require-profile';
import { reviewService } from './review.service';

const idsFrom = (req: Request) => ({
  patientId: idSchema.parse(req.params.patientId),
  caregiverId: idSchema.parse(req.params.caregiverId),
});

export const reviewController = {
  profile: (async (req, res) => {
    const { patientId, caregiverId } = idsFrom(req);
    const profile = await reviewService.caregiverProfile(
      requireActingUser(req.actingUser),
      patientId,
      caregiverId,
    );
    res.json({ data: profile });
  }) satisfies RequestHandler,

  review: (async (req, res) => {
    const { patientId, caregiverId } = idsFrom(req);
    const input = reviewInputSchema.parse(req.body);
    await reviewService.review(requireActingUser(req.actingUser), patientId, caregiverId, input);
    res.status(204).end();
  }) satisfies RequestHandler,
};
