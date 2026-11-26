import { describe, expect, it } from 'vitest';

import { cleanNumberInput, formatReadingValue, parseReadingDraft } from './reading-draft';

describe('cleanNumberInput', () => {
  it('accepts a comma as the decimal mark', () => {
    expect(cleanNumberInput('36,85', 1)).toBe('36.8');
  });

  it('drops decimals where the reading has none', () => {
    expect(cleanNumberInput('72.5', 0)).toBe('72');
  });
});

describe('parseReadingDraft', () => {
  it('turns a blood pressure draft into a reading', () => {
    expect(
      parseReadingDraft({ type: 'BLOOD_PRESSURE', value: '135', secondaryValue: '85' }),
    ).toEqual({ ok: true, reading: { type: 'BLOOD_PRESSURE', value: 135, secondaryValue: 85 } });
  });

  it('asks for both blood pressure numbers', () => {
    expect(parseReadingDraft({ type: 'BLOOD_PRESSURE', value: '135', secondaryValue: '' })).toEqual(
      { ok: false, message: 'Enter both numbers' },
    );
  });

  it('catches a missing decimal point', () => {
    expect(parseReadingDraft({ type: 'TEMPERATURE', value: '368', secondaryValue: '' }).ok).toBe(
      false,
    );
  });
});

describe('formatReadingValue', () => {
  it('shows blood pressure as two numbers', () => {
    expect(
      formatReadingValue({ type: 'BLOOD_PRESSURE', value: 135, secondaryValue: 85, unit: 'mmHg' }),
    ).toBe('135/85 mmHg');
  });
});
