import {
  allergyInputSchema,
  conditionInputSchema,
  healthDocumentInputSchema,
  idSchema,
  medicationInputSchema,
} from '@welcheq/shared';
import type { Request, RequestHandler } from 'express';

import { requireActingUser } from '@/middleware/require-profile';
import { healthDocumentService } from './health-document.service';
import { healthProfileService } from './health-profile.service';

const patientIdFrom = (req: Request) => idSchema.parse(req.params.patientId);
const entryIdFrom = (req: Request) => idSchema.parse(req.params.entryId);
const actorFrom = (req: Request) => requireActingUser(req.actingUser);

export const healthProfileController = {
  profile: (async (req, res) => {
    res.json({ data: await healthProfileService.profile(actorFrom(req), patientIdFrom(req)) });
  }) satisfies RequestHandler,

  addMedication: (async (req, res) => {
    const input = medicationInputSchema.parse(req.body);
    const medication = await healthProfileService.addMedication(
      actorFrom(req),
      patientIdFrom(req),
      input,
    );
    res.status(201).json({ data: medication });
  }) satisfies RequestHandler,

  updateMedication: (async (req, res) => {
    const input = medicationInputSchema.parse(req.body);
    const medication = await healthProfileService.updateMedication(
      actorFrom(req),
      patientIdFrom(req),
      entryIdFrom(req),
      input,
    );
    res.json({ data: medication });
  }) satisfies RequestHandler,

  stopMedication: (async (req, res) => {
    await healthProfileService.stopMedication(actorFrom(req), patientIdFrom(req), entryIdFrom(req));
    res.status(204).end();
  }) satisfies RequestHandler,

  addAllergy: (async (req, res) => {
    const input = allergyInputSchema.parse(req.body);
    const allergy = await healthProfileService.addAllergy(
      actorFrom(req),
      patientIdFrom(req),
      input,
    );
    res.status(201).json({ data: allergy });
  }) satisfies RequestHandler,

  updateAllergy: (async (req, res) => {
    const input = allergyInputSchema.parse(req.body);
    const allergy = await healthProfileService.updateAllergy(
      actorFrom(req),
      patientIdFrom(req),
      entryIdFrom(req),
      input,
    );
    res.json({ data: allergy });
  }) satisfies RequestHandler,

  removeAllergy: (async (req, res) => {
    await healthProfileService.removeAllergy(actorFrom(req), patientIdFrom(req), entryIdFrom(req));
    res.status(204).end();
  }) satisfies RequestHandler,

  addCondition: (async (req, res) => {
    const input = conditionInputSchema.parse(req.body);
    const condition = await healthProfileService.addCondition(
      actorFrom(req),
      patientIdFrom(req),
      input,
    );
    res.status(201).json({ data: condition });
  }) satisfies RequestHandler,

  updateCondition: (async (req, res) => {
    const input = conditionInputSchema.parse(req.body);
    const condition = await healthProfileService.updateCondition(
      actorFrom(req),
      patientIdFrom(req),
      entryIdFrom(req),
      input,
    );
    res.json({ data: condition });
  }) satisfies RequestHandler,

  removeCondition: (async (req, res) => {
    await healthProfileService.removeCondition(
      actorFrom(req),
      patientIdFrom(req),
      entryIdFrom(req),
    );
    res.status(204).end();
  }) satisfies RequestHandler,

  documents: (async (req, res) => {
    res.json({ data: await healthDocumentService.list(actorFrom(req), patientIdFrom(req)) });
  }) satisfies RequestHandler,

  requestDocumentUpload: (async (req, res) => {
    const upload = await healthDocumentService.requestUpload(actorFrom(req), patientIdFrom(req));
    res.status(201).json({ data: upload });
  }) satisfies RequestHandler,

  addDocument: (async (req, res) => {
    const { title, path } = healthDocumentInputSchema.parse(req.body);
    const document = await healthDocumentService.add(
      actorFrom(req),
      patientIdFrom(req),
      title,
      path,
    );
    res.status(201).json({ data: document });
  }) satisfies RequestHandler,

  viewDocument: (async (req, res) => {
    const view = await healthDocumentService.viewUrl(
      actorFrom(req),
      patientIdFrom(req),
      entryIdFrom(req),
    );
    res.json({ data: view });
  }) satisfies RequestHandler,

  removeDocument: (async (req, res) => {
    await healthDocumentService.remove(actorFrom(req), patientIdFrom(req), entryIdFrom(req));
    res.status(204).end();
  }) satisfies RequestHandler,
};
