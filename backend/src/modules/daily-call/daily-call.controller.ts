import {
  idSchema,
  patientContactSchema,
  recordDailyCallSchema,
  scheduleRangeSchema,
} from '@welcheq/shared';
import type { Request, RequestHandler } from 'express';

import { requireActingUser } from '@/middleware/require-profile';
import { dailyCallService } from './daily-call.service';

const patientIdFrom = (req: Request) => idSchema.parse(req.params.patientId);

export const dailyCallController = {
  prepare: (async (req, res) => {
    const call = await dailyCallService.prepare(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
    );
    res.json({ data: call });
  }) satisfies RequestHandler,

  record: (async (req, res) => {
    const input = recordDailyCallSchema.parse(req.body);
    const call = await dailyCallService.record(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      input,
    );
    res.status(201).json({ data: call });
  }) satisfies RequestHandler,

  history: (async (req, res) => {
    const { from, to } = scheduleRangeSchema.parse(req.query);
    const calls = await dailyCallService.history(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      from,
      to,
    );
    res.json({ data: calls });
  }) satisfies RequestHandler,

  updateContact: (async (req, res) => {
    const { phone } = patientContactSchema.parse(req.body);
    await dailyCallService.updateContact(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      phone,
    );
    res.status(204).end();
  }) satisfies RequestHandler,
};
