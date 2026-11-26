import { idSchema, messageInputSchema, messageQuerySchema } from '@welcheq/shared';
import type { Request, RequestHandler } from 'express';

import { requireActingUser } from '@/middleware/require-profile';
import { messageService } from './message.service';

const patientIdFrom = (req: Request) => idSchema.parse(req.params.patientId);

export const messageController = {
  list: (async (req, res) => {
    const { before } = messageQuerySchema.parse(req.query);
    const messages = await messageService.list(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      before,
    );
    res.json({ data: messages });
  }) satisfies RequestHandler,

  send: (async (req, res) => {
    const { body } = messageInputSchema.parse(req.body);
    const message = await messageService.send(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      body,
    );
    res.status(201).json({ data: message });
  }) satisfies RequestHandler,
};
