import { describe, expect, it } from 'vitest';

import { incidentInputSchema, readingInputSchema } from './health.schema';

describe('readingInputSchema', () => {
  it('accepts a blood pressure with both numbers', () => {
    expect(
      readingInputSchema.safeParse({ type: 'BLOOD_PRESSURE', value: 135, secondaryValue: 85 })
        .success,
    ).toBe(true);
  });

  it('catches numbers typed the wrong way round', () => {
    expect(
      readingInputSchema.safeParse({ type: 'BLOOD_PRESSURE', value: 85, secondaryValue: 135 })
        .success,
    ).toBe(false);
  });

  it('catches impossible values such as a missing decimal point', () => {
    expect(readingInputSchema.safeParse({ type: 'TEMPERATURE', value: 372 }).success).toBe(false);
  });

  it('only lets blood pressure carry a second number', () => {
    expect(
      readingInputSchema.safeParse({ type: 'HEART_RATE', value: 72, secondaryValue: 60 }).success,
    ).toBe(false);
  });
});

describe('incidentInputSchema', () => {
  it('needs a real description', () => {
    expect(
      incidentInputSchema.safeParse({
        category: 'FALL',
        severity: 'HIGH',
        description: 'fell',
        occurredAt: '2026-11-26T09:00:00Z',
      }).success,
    ).toBe(false);
  });
});
