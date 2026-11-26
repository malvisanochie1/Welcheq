import { z } from 'zod';

import { CARE_PLAN_RULES, CARE_TASK_CATEGORIES, TASK_OUTCOMES } from '../constants/care-plan';
import { TEXT_LIMIT } from '../constants/limits';
import { parseClockTime } from '../care-plan/clock';
import { CARE_PLAN_TEMPLATES } from '../care-plan/templates';

const DAYS_IN_WEEK = 7;

export const clockTimeSchema = z
  .string()
  .refine((value) => parseClockTime(value) !== null, 'Use a 24-hour time like 08:30');

export const daysOfWeekSchema = z
  .array(
    z
      .number()
      .int()
      .min(0)
      .max(DAYS_IN_WEEK - 1),
  )
  .max(DAYS_IN_WEEK)
  .refine((days) => new Set(days).size === days.length, 'Each day can only be chosen once');

export const careTaskInputSchema = z.strictObject({
  title: z
    .string()
    .trim()
    .min(2, 'Describe the task')
    .max(CARE_PLAN_RULES.TITLE_MAX_LENGTH, 'Keep the task title short'),
  category: z.enum(CARE_TASK_CATEGORIES),
  time: clockTimeSchema,
  daysOfWeek: daysOfWeekSchema.default([]),
  instructions: z
    .string()
    .trim()
    .max(CARE_PLAN_RULES.INSTRUCTIONS_MAX_LENGTH, 'Keep the instructions shorter')
    .optional(),
});

export type CareTaskInput = z.input<typeof careTaskInputSchema>;

export const updateCareTaskSchema = careTaskInputSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Nothing to update');

export type UpdateCareTaskInput = z.input<typeof updateCareTaskSchema>;

const TEMPLATE_IDS = CARE_PLAN_TEMPLATES.map((template) => template.id) as [string, ...string[]];

export const applyTemplateSchema = z.strictObject({
  templateId: z.enum(TEMPLATE_IDS),
});

export const checklistQuerySchema = z.object({
  date: z.iso.date().optional(),
});

export const recordTaskSchema = z.strictObject({
  date: z.iso.date(),
  outcome: z.enum(TASK_OUTCOMES),
  note: z.string().trim().max(TEXT_LIMIT.SHORT_NOTE).optional(),
});

export type RecordTaskInput = z.infer<typeof recordTaskSchema>;
