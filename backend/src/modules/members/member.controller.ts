import { idSchema } from '@welcheq/shared';
import type { RequestHandler } from 'express';

import { requireActingUser } from '@/middleware/require-profile';
import { memberService } from './member.service';

export const memberController = {
  list: (async (req, res) => {
    const members = await memberService.list(
      requireActingUser(req.actingUser),
      idSchema.parse(req.params.patientId),
    );
    res.json({ data: members });
  }) satisfies RequestHandler,

  remove: (async (req, res) => {
    await memberService.remove(
      requireActingUser(req.actingUser),
      idSchema.parse(req.params.patientId),
      idSchema.parse(req.params.userId),
    );
    res.status(204).end();
  }) satisfies RequestHandler,
};
