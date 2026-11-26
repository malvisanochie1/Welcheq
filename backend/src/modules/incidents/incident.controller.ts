import {
  idSchema,
  INCIDENT_STATUS,
  incidentInputSchema,
  resolveIncidentSchema,
} from '@welcheq/shared';
import type { Request, RequestHandler } from 'express';
import { z } from 'zod';

import { requireActingUser } from '@/middleware/require-profile';
import { incidentService } from './incident.service';

const patientIdFrom = (req: Request) => idSchema.parse(req.params.patientId);
const listQuerySchema = z.object({ status: z.enum(Object.values(INCIDENT_STATUS)).optional() });

export const incidentController = {
  report: (async (req, res) => {
    const input = incidentInputSchema.parse(req.body);
    const incident = await incidentService.report(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      input,
    );
    res.status(201).json({ data: incident });
  }) satisfies RequestHandler,

  list: (async (req, res) => {
    const { status } = listQuerySchema.parse(req.query);
    const incidents = await incidentService.list(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      status,
    );
    res.json({ data: incidents });
  }) satisfies RequestHandler,

  resolve: (async (req, res) => {
    const { resolutionNote } = resolveIncidentSchema.parse(req.body);
    const incident = await incidentService.resolve(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      idSchema.parse(req.params.incidentId),
      resolutionNote,
    );
    res.json({ data: incident });
  }) satisfies RequestHandler,
};
