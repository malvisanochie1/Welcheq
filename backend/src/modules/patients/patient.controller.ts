import {
  createPatientSchema,
  idSchema,
  proofSettingsSchema,
  updatePatientSchema,
} from '@welcheq/shared';
import type { Request, RequestHandler } from 'express';

import { requireActingUser } from '@/middleware/require-profile';
import { patientService } from './patient.service';

const patientIdFrom = (req: Request) => idSchema.parse(req.params.patientId);

export const patientController = {
  create: (async (req, res) => {
    const input = createPatientSchema.parse(req.body);
    const patient = await patientService.create(requireActingUser(req.actingUser), input);
    res.status(201).json({ data: patient });
  }) satisfies RequestHandler,

  list: (async (req, res) => {
    const patients = await patientService.list(requireActingUser(req.actingUser));
    res.json({ data: patients });
  }) satisfies RequestHandler,

  get: (async (req, res) => {
    const patient = await patientService.get(requireActingUser(req.actingUser), patientIdFrom(req));
    res.json({ data: patient });
  }) satisfies RequestHandler,

  update: (async (req, res) => {
    const input = updatePatientSchema.parse(req.body);
    const patient = await patientService.update(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      input,
    );
    res.json({ data: patient });
  }) satisfies RequestHandler,

  updateProofSettings: (async (req, res) => {
    const input = proofSettingsSchema.parse(req.body);
    const patient = await patientService.updateProofSettings(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      input,
    );
    res.json({ data: patient });
  }) satisfies RequestHandler,
};
