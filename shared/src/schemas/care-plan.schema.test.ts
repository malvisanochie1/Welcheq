import { describe, expect, it } from 'vitest';

import { applyTemplateSchema, careTaskInputSchema, recordTaskSchema } from './care-plan.schema';

describe('careTaskInputSchema', () => {
  const valid = { title: 'Morning medicine', category: 'MEDICATION', time: '08:00' };

  it('defaults to every day', () => {
    expect(careTaskInputSchema.parse(valid).daysOfWeek).toEqual([]);
  });

  it('refuses impossible times', () => {
    expect(careTaskInputSchema.safeParse({ ...valid, time: '25:00' }).success).toBe(false);
  });

  it('refuses repeated or impossible days', () => {
    expect(careTaskInputSchema.safeParse({ ...valid, daysOfWeek: [1, 1] }).success).toBe(false);
    expect(careTaskInputSchema.safeParse({ ...valid, daysOfWeek: [7] }).success).toBe(false);
  });
});

describe('applyTemplateSchema', () => {
  it('only accepts known templates', () => {
    expect(applyTemplateSchema.safeParse({ templateId: 'elderly-diabetes' }).success).toBe(true);
    expect(applyTemplateSchema.safeParse({ templateId: 'made-up' }).success).toBe(false);
  });
});

describe('recordTaskSchema', () => {
  it('requires a date and an outcome', () => {
    expect(recordTaskSchema.safeParse({ date: '2026-11-26', outcome: 'DONE' }).success).toBe(true);
    expect(recordTaskSchema.safeParse({ outcome: 'DONE' }).success).toBe(false);
  });
});
