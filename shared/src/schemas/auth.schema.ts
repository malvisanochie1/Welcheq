import { z } from 'zod';

import { TEXT_LIMIT } from '../constants/limits';

export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 72,
} as const;

export const emailSchema = z
  .email('Enter a valid email address')
  .trim()
  .toLowerCase()
  .max(TEXT_LIMIT.EMAIL);

export const passwordSchema = z
  .string()
  .min(PASSWORD_RULES.MIN_LENGTH, `Use at least ${PASSWORD_RULES.MIN_LENGTH} characters`)
  .max(PASSWORD_RULES.MAX_LENGTH, `Use at most ${PASSWORD_RULES.MAX_LENGTH} characters`);

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password'),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const passwordResetRequestSchema = z.object({ email: emailSchema });

export const newPasswordSchema = z
  .object({ password: passwordSchema, confirmation: z.string() })
  .refine((values) => values.password === values.confirmation, {
    message: 'The two passwords do not match',
    path: ['confirmation'],
  });

export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
