import { z } from 'zod';

import { REVIEW_RULES } from '../constants/reviews';

export const reviewInputSchema = z.strictObject({
  rating: z
    .number()
    .int()
    .min(REVIEW_RULES.MIN_RATING, 'Choose a rating')
    .max(REVIEW_RULES.MAX_RATING),
  comment: z
    .string()
    .trim()
    .max(REVIEW_RULES.COMMENT_MAX_LENGTH)
    .transform((value) => value || null)
    .nullable()
    .optional(),
});

export type ReviewInput = z.input<typeof reviewInputSchema>;
