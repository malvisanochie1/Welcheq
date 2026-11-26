import { describe, expect, it } from 'vitest';

import { allergyInputSchema, medicationInputSchema } from './health-profile.schema';

describe('medicationInputSchema', () => {
  it('stores empty details as nothing', () => {
    expect(medicationInputSchema.parse({ name: 'Amlodipine', dose: '  ' })).toEqual({
      name: 'Amlodipine',
      dose: null,
    });
  });

  it('needs a name', () => {
    expect(medicationInputSchema.safeParse({ name: ' ' }).success).toBe(false);
  });
});

describe('allergyInputSchema', () => {
  it('needs a known severity', () => {
    expect(allergyInputSchema.safeParse({ substance: 'Penicillin', severity: 'BAD' }).success).toBe(
      false,
    );
  });
});
