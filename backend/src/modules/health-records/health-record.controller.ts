import {
  idSchema,
  readingInputSchema,
  readingQuerySchema,
  visitReportSchema,
} from '@welcheq/shared';
import type { Request, RequestHandler } from 'express';

import { requireActingUser } from '@/middleware/require-profile';
import { healthRecordService } from './health-record.service';

const patientIdFrom = (req: Request) => idSchema.parse(req.params.patientId);

export const healthRecordController = {
  saveVisitReport: (async (req, res) => {
    const input = visitReportSchema.parse(req.body);
    const report = await healthRecordService.saveVisitReport(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      idSchema.parse(req.params.visitId),
      input,
    );
    res.json({ data: report });
  }) satisfies RequestHandler,

  visitReport: (async (req, res) => {
    const report = await healthRecordService.visitReport(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      idSchema.parse(req.params.visitId),
    );
    res.json({ data: report });
  }) satisfies RequestHandler,

  addReading: (async (req, res) => {
    const reading = readingInputSchema.parse(req.body);
    const created = await healthRecordService.addReading(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      reading,
    );
    res.status(201).json({ data: created });
  }) satisfies RequestHandler,

  listReadings: (async (req, res) => {
    const query = readingQuerySchema.parse(req.query);
    const readings = await healthRecordService.listReadings(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      query,
    );
    res.json({ data: readings });
  }) satisfies RequestHandler,
};
