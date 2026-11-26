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
