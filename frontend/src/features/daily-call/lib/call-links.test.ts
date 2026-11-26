import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Linking: { openURL: vi.fn() } }));

const { whatsappNumber } = await import('./call-links');

describe('whatsappNumber', () => {
  it('turns a local Nigerian number into an international one', () => {
    expect(whatsappNumber('0803 555 0101')).toBe('2348035550101');
  });

  it('keeps numbers that already have a country code', () => {
    expect(whatsappNumber('+234 803 555 0101')).toBe('2348035550101');
  });
});
