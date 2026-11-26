import { z } from 'zod';

import {
  CALL_ANSWER,
  CALL_OUTCOME,
  CALL_QUESTION_KIND,
  DAILY_CALL_RULES,
} from '../constants/daily-call';
import { idSchema, phoneSchema } from './common.schema';

const MAX_ANSWERS = DAILY_CALL_RULES.MAX_TASK_QUESTIONS + 1;

const answerSchema = z.strictObject({
  kind: z.enum(Object.values(CALL_QUESTION_KIND)),
  taskId: idSchema.nullable(),
  answer: z.enum(Object.values(CALL_ANSWER)),
});

export const recordDailyCallSchema = z
  .strictObject({
    date: z.iso.date(),
    outcome: z.enum(Object.values(CALL_OUTCOME)),
    answers: z.array(answerSchema).max(MAX_ANSWERS).default([]),
    note: z.string().trim().max(DAILY_CALL_RULES.NOTE_MAX_LENGTH).optional(),
  })
  .refine(({ outcome, answers }) => outcome === CALL_OUTCOME.REACHED || answers.length === 0, {
    message: 'There are no answers when the call did not get through',
    path: ['answers'],
  });

export type RecordDailyCallInput = z.input<typeof recordDailyCallSchema>;

export const patientContactSchema = z.strictObject({
  phone: phoneSchema.nullable(),
});
