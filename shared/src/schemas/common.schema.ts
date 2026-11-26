import { z } from 'zod';

import { PAGINATION, TEXT_LIMIT } from '../constants/limits';

export const idSchema = z.uuid();

export const personNameSchema = z
  .string()
  .trim()
  .min(2, 'Enter a full name')
  .max(TEXT_LIMIT.NAME, 'This name is too long');

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid phone number')
  .max(TEXT_LIMIT.PHONE);

export const geoPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const paginationSchema = z.object({
  cursor: idSchema.optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.MAX_PAGE_SIZE)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
});

export type Pagination = z.infer<typeof paginationSchema>;

export const markNotificationsReadSchema = z.union([
  z.strictObject({ all: z.literal(true) }),
  z.strictObject({ ids: z.array(z.uuid()).min(1).max(100) }),
]);
