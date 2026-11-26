import { acceptInvitationSchema, idSchema } from '@welcheq/shared';
import type { RequestHandler } from 'express';

import { requireActingUser } from '@/middleware/require-profile';
import { homeDisplayService } from './home-display.service';

export const homeDisplayController = {
  createPairing: (async (req, res) => {
    const pairing = await homeDisplayService.createPairing(
      requireActingUser(req.actingUser),
      idSchema.parse(req.params.patientId),
    );
    res.status(201).json({ data: pairing });
  }) satisfies RequestHandler,

  reset: (async (req, res) => {
    await homeDisplayService.reset(
      requireActingUser(req.actingUser),
      idSchema.parse(req.params.patientId),
    );
    res.status(204).end();
  }) satisfies RequestHandler,

  pair: (async (req, res) => {
    const { code } = acceptInvitationSchema.parse(req.body);
    const display = await homeDisplayService.pair(code);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: display });
  }) satisfies RequestHandler,
};
