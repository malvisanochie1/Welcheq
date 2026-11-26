import {
  attendanceEventSchema,
  createShiftSchema,
  DEFAULT_PATIENT_TIME_ZONE,
  idSchema,
  scheduleRangeSchema,
  surpriseCheckResponseSchema,
} from '@welcheq/shared';
import type { Request, RequestHandler } from 'express';

import { requireActingUser } from '@/middleware/require-profile';
import { localRange, scheduleService } from './schedule.service';
import { visitService } from './visit.service';

const patientIdFrom = (req: Request) => idSchema.parse(req.params.patientId);

export const attendanceController = {
  listShifts: (async (req, res) => {
    const { from, to } = scheduleRangeSchema.parse(req.query);
    const shifts = await scheduleService.listForPatient(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      from,
      to,
    );
    res.json({ data: shifts });
  }) satisfies RequestHandler,

  scheduleShifts: (async (req, res) => {
    const input = createShiftSchema.parse(req.body);
    const shifts = await scheduleService.schedule(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      input,
    );
    res.status(201).json({ data: shifts });
  }) satisfies RequestHandler,

  cancelShift: (async (req, res) => {
    await scheduleService.cancel(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      idSchema.parse(req.params.shiftId),
    );
    res.status(204).end();
  }) satisfies RequestHandler,

  listVisits: (async (req, res) => {
    const { from, to } = scheduleRangeSchema.parse(req.query);
    const visits = await visitService.listForPatient(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      from,
      to,
    );
    res.json({ data: visits });
  }) satisfies RequestHandler,

  checkIn: (async (req, res) => {
    const event = attendanceEventSchema.parse(req.body);
    const visit = await visitService.checkIn(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      event,
    );
    res.status(201).json({ data: visit });
  }) satisfies RequestHandler,

  checkOut: (async (req, res) => {
    const event = attendanceEventSchema.parse(req.body);
    const visit = await visitService.checkOut(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      idSchema.parse(req.params.visitId),
      event,
    );
    res.json({ data: visit });
  }) satisfies RequestHandler,

  answerSurpriseCheck: (async (req, res) => {
    const response = surpriseCheckResponseSchema.parse(req.body);
    const result = await visitService.answerSurpriseCheck(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      idSchema.parse(req.params.visitId),
      response,
    );
    res.json({ data: result });
  }) satisfies RequestHandler,

  myShifts: (async (req, res) => {
    const { from, to } = scheduleRangeSchema.parse(req.query);
    const shifts = await scheduleService.listMine(
      requireActingUser(req.actingUser),
      localRange(from, to, DEFAULT_PATIENT_TIME_ZONE),
    );
    res.json({ data: shifts });
  }) satisfies RequestHandler,

  myOpenVisit: (async (req, res) => {
    const visit = await visitService.openVisit(requireActingUser(req.actingUser));
    res.json({ data: visit });
  }) satisfies RequestHandler,
};
