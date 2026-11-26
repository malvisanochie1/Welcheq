import { z } from 'zod';

import { SELF_ASSIGNABLE_ROLES } from '../constants/roles';
import { personNameSchema, phoneSchema } from './common.schema';

export const completeProfileSchema = z.strictObject({
  fullName: personNameSchema,
  phone: phoneSchema.optional(),
  role: z.enum(SELF_ASSIGNABLE_ROLES),
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

export const updateProfileSchema = completeProfileSchema.omit({ role: true }).partial();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
