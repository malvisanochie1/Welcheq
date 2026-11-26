import {
  READING_SPECS,
  READING_TYPE,
  readingInputSchema,
  type ReadingInput,
  type ReadingType,
} from '@welcheq/shared';

export interface ReadingDraft {
  type: ReadingType;
  value: string;
  secondaryValue: string;
}

export type ReadingDraftResult =
  { ok: true; reading: ReadingInput } | { ok: false; message: string };

export const emptyDraft = (type: ReadingType): ReadingDraft => ({
  type,
  value: '',
  secondaryValue: '',
});

/** Keeps digits and one decimal point, accepting a comma as the decimal mark. */
export function cleanNumberInput(text: string, decimals: number): string {
  const normalised = text.replace(',', '.').replace(/[^\d.]/g, '');
  const [whole = '', ...rest] = normalised.split('.');
  if (decimals === 0 || rest.length === 0) return whole;
  return `${whole}.${rest.join('').slice(0, decimals)}`;
}

export function parseReadingDraft(draft: ReadingDraft): ReadingDraftResult {
  const isBloodPressure = draft.type === READING_TYPE.BLOOD_PRESSURE;
  if (!draft.value || (isBloodPressure && !draft.secondaryValue)) {
    return {
      ok: false,
      message: isBloodPressure ? 'Enter both numbers' : 'Enter a number or remove this reading',
    };
  }

  const parsed = readingInputSchema.safeParse({
    type: draft.type,
    value: Number(draft.value),
    ...(isBloodPressure ? { secondaryValue: Number(draft.secondaryValue) } : {}),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check this reading' };
  }
  return { ok: true, reading: parsed.data };
}

export function formatReadingValue(reading: {
  type: ReadingType;
  value: number;
  secondaryValue: number | null;
  unit: string;
}): string {
  const { decimals } = READING_SPECS[reading.type];
  const value = reading.value.toFixed(decimals);
  const amount =
    reading.secondaryValue === null ? value : `${value}/${reading.secondaryValue.toFixed(0)}`;
  return `${amount} ${reading.unit}`;
}
