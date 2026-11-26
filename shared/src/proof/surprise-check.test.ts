import { describe, expect, it } from 'vitest';

import {
  pickSurpriseCheckTime,
  SURPRISE_CHECK_STATUS,
  surpriseCheckStatus,
} from './surprise-check';

const at = (iso: string) => new Date(iso);
const checkIn = at('2026-11-26T08:00:00Z');
const plannedEnd = at('2026-11-26T16:00:00Z');

describe('pickSurpriseCheckTime', () => {
  it('stays between 30 minutes after arrival and 20 minutes before the end', () => {
    expect(pickSurpriseCheckTime(checkIn, plannedEnd, 0).toISOString()).toBe(
      '2026-11-26T08:30:00.000Z',
    );
    expect(pickSurpriseCheckTime(checkIn, plannedEnd, 0.999999).getTime()).toBeLessThan(
      at('2026-11-26T15:40:00Z').getTime(),
    );
  });

  it('uses a three-hour window without a planned end', () => {
    expect(pickSurpriseCheckTime(checkIn, null, 0.999999).getTime()).toBeLessThan(
      at('2026-11-26T11:30:00Z').getTime(),
    );
  });
});

describe('surpriseCheckStatus', () => {
  const check = { dueAt: at('2026-11-26T10:00:00Z'), respondedAt: null, passed: null };

  it('stays hidden until due', () => {
    expect(surpriseCheckStatus(check, null, at('2026-11-26T09:59:00Z'))).toBe(
      SURPRISE_CHECK_STATUS.WAITING,
    );
    expect(surpriseCheckStatus(check, null, at('2026-11-26T10:05:00Z'))).toBe(
      SURPRISE_CHECK_STATUS.DUE,
    );
  });

  it('is missed after 30 minutes or if the caregiver leaves without answering', () => {
    expect(surpriseCheckStatus(check, null, at('2026-11-26T10:31:00Z'))).toBe(
      SURPRISE_CHECK_STATUS.MISSED,
    );
    expect(surpriseCheckStatus(check, at('2026-11-26T10:10:00Z'), at('2026-11-26T10:11:00Z'))).toBe(
      SURPRISE_CHECK_STATUS.MISSED,
    );
  });

  it('does not count against a visit that ended before it was due', () => {
    expect(surpriseCheckStatus(check, at('2026-11-26T09:00:00Z'), at('2026-11-26T12:00:00Z'))).toBe(
      SURPRISE_CHECK_STATUS.NOT_REACHED,
    );
  });

  it('reports the answer', () => {
    const answered = { ...check, respondedAt: at('2026-11-26T10:02:00Z') };
    expect(
      surpriseCheckStatus({ ...answered, passed: true }, null, at('2026-11-26T11:00:00Z')),
    ).toBe(SURPRISE_CHECK_STATUS.PASSED);
    expect(
      surpriseCheckStatus({ ...answered, passed: false }, null, at('2026-11-26T11:00:00Z')),
    ).toBe(SURPRISE_CHECK_STATUS.FAILED);
  });
});
