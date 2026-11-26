import { describe, expect, it } from 'vitest';

import { scaleTextClasses } from './scale-text';

describe('scaleTextClasses', () => {
  it('leaves standard text alone', () => {
    expect(scaleTextClasses('font-body text-base text-ink', 'standard')).toBe(
      'font-body text-base text-ink',
    );
  });

  it('moves sizes up without touching colours', () => {
    expect(scaleTextClasses('font-body text-sm text-ink-muted', 'large')).toBe(
      'font-body text-base text-ink-muted',
    );
  });

  it('stops at the largest size', () => {
    expect(scaleTextClasses('text-4xl', 'extra-large')).toBe('text-5xl');
  });
});
