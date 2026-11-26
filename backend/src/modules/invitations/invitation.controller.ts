import { acceptInvitationSchema, createInvitationSchema, idSchema } from '@welcheq/shared';
import type { RequestHandler } from 'express';

import { requireActingUser } from '@/middleware/require-profile';
import { invitationService } from './invitation.service';

export const invitationController = {
  create: (async (req, res) => {
    const input = createInvitationSchema.parse(req.body);
    const invitation = await invitationService.create(
      requireActingUser(req.actingUser),
      idSchema.parse(req.params.patientId),
      input,
    );
    res.status(201).json({ data: invitation });
  }) satisfies RequestHandler,

  listPending: (async (req, res) => {
    const invitations = await invitationService.listPending(
      requireActingUser(req.actingUser),
      idSchema.parse(req.params.patientId),
    );
    res.json({ data: invitations });
  }) satisfies RequestHandler,

  revoke: (async (req, res) => {
    await invitationService.revoke(
      requireActingUser(req.actingUser),
      idSchema.parse(req.params.patientId),
      idSchema.parse(req.params.invitationId),
    );
    res.status(204).end();
  }) satisfies RequestHandler,

  accept: (async (req, res) => {
    const { code } = acceptInvitationSchema.parse(req.body);
    const result = await invitationService.accept(requireActingUser(req.actingUser), code);
    res.json({ data: result });
  }) satisfies RequestHandler,
};
