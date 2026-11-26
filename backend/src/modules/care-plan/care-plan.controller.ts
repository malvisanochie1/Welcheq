import {
  applyTemplateSchema,
  careTaskInputSchema,
  checklistQuerySchema,
  idSchema,
  recordTaskSchema,
  updateCareTaskSchema,
} from '@welcheq/shared';
import type { Request, RequestHandler } from 'express';

import { requireActingUser } from '@/middleware/require-profile';
import { carePlanService } from './care-plan.service';

const patientIdFrom = (req: Request) => idSchema.parse(req.params.patientId);
const taskIdFrom = (req: Request) => idSchema.parse(req.params.taskId);

export const carePlanController = {
  listTasks: (async (req, res) => {
    const tasks = await carePlanService.listTasks(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
    );
    res.json({ data: tasks });
  }) satisfies RequestHandler,

  addTask: (async (req, res) => {
    const input = careTaskInputSchema.parse(req.body);
    const task = await carePlanService.addTask(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      input,
    );
    res.status(201).json({ data: task });
  }) satisfies RequestHandler,

  applyTemplate: (async (req, res) => {
    const { templateId } = applyTemplateSchema.parse(req.body);
    const tasks = await carePlanService.applyTemplate(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      templateId,
    );
    res.json({ data: tasks });
  }) satisfies RequestHandler,

  updateTask: (async (req, res) => {
    const input = updateCareTaskSchema.parse(req.body);
    const task = await carePlanService.updateTask(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      taskIdFrom(req),
      input,
    );
    res.json({ data: task });
  }) satisfies RequestHandler,

  removeTask: (async (req, res) => {
    await carePlanService.removeTask(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      taskIdFrom(req),
    );
    res.status(204).end();
  }) satisfies RequestHandler,

  checklist: (async (req, res) => {
    const { date } = checklistQuerySchema.parse(req.query);
    const checklist = await carePlanService.checklist(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      date,
    );
    res.json({ data: checklist });
  }) satisfies RequestHandler,

  recordTask: (async (req, res) => {
    const input = recordTaskSchema.parse(req.body);
    const checklist = await carePlanService.recordTask(
      requireActingUser(req.actingUser),
      patientIdFrom(req),
      taskIdFrom(req),
      input,
    );
    res.json({ data: checklist });
  }) satisfies RequestHandler,
};
