import { z } from 'zod';

import { ALLERGY_SEVERITY, HEALTH_PROFILE_LIMITS } from '../constants/health-profile';

const name = (message: string) =>
  z.string().trim().min(1, message).max(HEALTH_PROFILE_LIMITS.NAME_MAX_LENGTH);

const optionalDetail = z
  .string()
  .trim()
  .max(HEALTH_PROFILE_LIMITS.DETAIL_MAX_LENGTH)
  .transform((value) => value || null)
  .nullable()
  .optional();

export const medicationInputSchema = z.strictObject({
  name: name('Enter the name of the medicine'),
  dose: optionalDetail,
  instructions: optionalDetail,
});

export type MedicationInput = z.input<typeof medicationInputSchema>;
export type MedicationData = z.output<typeof medicationInputSchema>;

export const allergyInputSchema = z.strictObject({
  substance: name('Enter what they are allergic to'),
  reaction: optionalDetail,
  severity: z.enum(Object.values(ALLERGY_SEVERITY)),
});

export type AllergyInput = z.input<typeof allergyInputSchema>;
export type AllergyData = z.output<typeof allergyInputSchema>;

export const conditionInputSchema = z.strictObject({
  name: name('Enter the condition'),
  notes: optionalDetail,
  diagnosedOn: z.iso.date().nullable().optional(),
});

export type ConditionInput = z.input<typeof conditionInputSchema>;
export type ConditionData = z.output<typeof conditionInputSchema>;

export const healthDocumentInputSchema = z.strictObject({
  title: name('Give the document a name, for example "Blood test, March"'),
  path: z.string().min(1).max(HEALTH_PROFILE_LIMITS.DETAIL_MAX_LENGTH),
});
