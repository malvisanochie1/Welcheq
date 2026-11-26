import { ApiError } from './api-client';
import type { ZodError } from 'zod';

export type FieldErrors<TField extends string> = Partial<Record<TField, string>>;

export function toFieldErrors<TField extends string>(error: ZodError): FieldErrors<TField> {
  const errors: FieldErrors<TField> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !(field in errors)) {
      errors[field as TField] = issue.message;
    }
  }

  return errors;
}

const FALLBACK_MESSAGE = 'Please try again.';

/** Turns a failed request into a message that is safe to show. */
export function describeRequestError(error: unknown): string | null {
  if (!error) return null;
  return error instanceof ApiError ? error.message : FALLBACK_MESSAGE;
}
