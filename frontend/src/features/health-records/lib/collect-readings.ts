import type { ReadingInput, ReadingType } from '@welcheq/shared';

import { parseReadingDraft, type ReadingDraft } from './reading-draft';

export interface CollectedReadings {
  readings: ReadingInput[];
  errors: Partial<Record<ReadingType, string>>;
}

export function collectReadings(drafts: ReadingDraft[]): CollectedReadings {
  const readings: ReadingInput[] = [];
  const errors: Partial<Record<ReadingType, string>> = {};
  for (const draft of drafts) {
    const result = parseReadingDraft(draft);
    if (result.ok) readings.push(result.reading);
    else errors[draft.type] = result.message;
  }
  return { readings, errors };
}
