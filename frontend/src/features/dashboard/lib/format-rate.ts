const PERCENT = 100;

/** "92%", or a dash when there is nothing to measure yet. */
export function formatRate(rate: number | null): string {
  return rate === null ? '–' : `${Math.round(rate * PERCENT)}%`;
}
