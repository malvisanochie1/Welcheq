import { describe, expect, it } from 'vitest';

import { homeCodeAt, isValidHomeCode, secondsUntilNextHomeCode } from './home-code';

const SECRET = '3132333435363738393031323334353637383930313233343536373839303132';
const at = (iso: string) => new Date(iso);

describe('home code', () => {
  it('is six digits and stable within a minute', () => {
    const code = homeCodeAt(SECRET, at('2026-11-26T08:00:05Z'));
    expect(code).toMatch(/^\d{6}$/);
    expect(homeCodeAt(SECRET, at('2026-11-26T08:00:55Z'))).toBe(code);
  });

  it('changes every minute', () => {
    expect(homeCodeAt(SECRET, at('2026-11-26T08:01:05Z'))).not.toBe(
      homeCodeAt(SECRET, at('2026-11-26T08:00:05Z')),
    );
  });

  it('accepts the previous minute’s code but not older ones', () => {
    const shown = homeCodeAt(SECRET, at('2026-11-26T08:00:30Z'));
    expect(isValidHomeCode(SECRET, shown, at('2026-11-26T08:01:20Z'))).toBe(true);
    expect(isValidHomeCode(SECRET, shown, at('2026-11-26T08:03:00Z'))).toBe(false);
  });

  it('depends on the home’s secret', () => {
    const other = 'a'.repeat(64);
    const instant = at('2026-11-26T08:00:30Z');
    expect(isValidHomeCode(other, homeCodeAt(SECRET, instant), instant)).toBe(false);
  });

  it('counts down to the next code', () => {
    expect(secondsUntilNextHomeCode(at('2026-11-26T08:00:45Z'))).toBe(15);
  });
});
