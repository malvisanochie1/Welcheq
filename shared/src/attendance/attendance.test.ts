import { describe, expect, it } from 'vitest';

import { SHIFT_STATUS } from '../constants/attendance';
import { createShiftSchema, shiftDurationMinutes } from '../schemas/attendance.schema';
import {
  isEarlyDeparture,
  isLateArrival,
  isWithinCheckInWindow,
  shiftStatus,
  shiftsOverlap,
} from './shift-status';
import { zonedDateTimeToInstant } from './zoned-time';

const at = (iso: string) => new Date(iso);
const shift = {
  startsAt: at('2026-11-26T07:00:00Z'),
  endsAt: at('2026-11-26T15:00:00Z'),
  cancelledAt: null,
};

describe('zonedDateTimeToInstant', () => {
  it('converts Lagos local time to UTC', () => {
    expect(zonedDateTimeToInstant('2026-11-26', 8 * 60, 'Africa/Lagos').toISOString()).toBe(
      '2026-11-26T07:00:00.000Z',
    );
  });

  it('handles daylight saving zones', () => {
    expect(zonedDateTimeToInstant('2026-07-01', 9 * 60, 'Europe/London').toISOString()).toBe(
      '2026-07-01T08:00:00.000Z',
    );
  });
});

describe('shiftStatus', () => {
  it('is scheduled before the start', () => {
    expect(shiftStatus(shift, null, at('2026-11-26T06:00:00Z'))).toBe(SHIFT_STATUS.SCHEDULED);
  });

  it('waits for arrival just after the start', () => {
    expect(shiftStatus(shift, null, at('2026-11-26T07:20:00Z'))).toBe(
      SHIFT_STATUS.AWAITING_ARRIVAL,
    );
  });

  it('is missed an hour after the start with no check-in', () => {
    expect(shiftStatus(shift, null, at('2026-11-26T08:00:00Z'))).toBe(SHIFT_STATUS.MISSED);
  });

  it('follows the visit once the caregiver checks in and out', () => {
    const visit = { checkInAt: at('2026-11-26T07:05:00Z'), checkOutAt: null };
    expect(shiftStatus(shift, visit, at('2026-11-26T10:00:00Z'))).toBe(SHIFT_STATUS.IN_PROGRESS);
    expect(
      shiftStatus(
        shift,
        { ...visit, checkOutAt: at('2026-11-26T15:00:00Z') },
        at('2026-11-26T16:00:00Z'),
      ),
    ).toBe(SHIFT_STATUS.COMPLETED);
  });

  it('stays cancelled', () => {
    expect(
      shiftStatus(
        { ...shift, cancelledAt: at('2026-11-25T00:00:00Z') },
        null,
        at('2026-11-26T09:00:00Z'),
      ),
    ).toBe(SHIFT_STATUS.CANCELLED);
  });
});

describe('arrival and departure', () => {
  it('flags arrivals more than 15 minutes late', () => {
    expect(isLateArrival(shift, { checkInAt: at('2026-11-26T07:10:00Z'), checkOutAt: null })).toBe(
      false,
    );
    expect(isLateArrival(shift, { checkInAt: at('2026-11-26T07:20:00Z'), checkOutAt: null })).toBe(
      true,
    );
  });

  it('flags departures more than 15 minutes early', () => {
    const checkInAt = at('2026-11-26T07:00:00Z');
    expect(isEarlyDeparture(shift, { checkInAt, checkOutAt: at('2026-11-26T14:50:00Z') })).toBe(
      false,
    );
    expect(isEarlyDeparture(shift, { checkInAt, checkOutAt: at('2026-11-26T13:00:00Z') })).toBe(
      true,
    );
  });

  it('opens check-in an hour before the start and closes at the end', () => {
    expect(isWithinCheckInWindow(shift, at('2026-11-26T06:05:00Z'))).toBe(true);
    expect(isWithinCheckInWindow(shift, at('2026-11-26T05:30:00Z'))).toBe(false);
    expect(isWithinCheckInWindow(shift, at('2026-11-26T15:00:00Z'))).toBe(false);
  });

  it('detects overlapping shifts', () => {
    const later = {
      ...shift,
      startsAt: at('2026-11-26T14:00:00Z'),
      endsAt: at('2026-11-26T18:00:00Z'),
    };
    const after = {
      ...shift,
      startsAt: at('2026-11-26T15:00:00Z'),
      endsAt: at('2026-11-26T18:00:00Z'),
    };
    expect(shiftsOverlap(shift, later)).toBe(true);
    expect(shiftsOverlap(shift, after)).toBe(false);
  });
});

describe('createShiftSchema', () => {
  const valid = {
    caregiverId: '33333333-3333-4333-8333-333333333333',
    date: '2026-11-27',
    startTime: '08:00',
    endTime: '16:00',
  };

  it('supports overnight visits', () => {
    expect(shiftDurationMinutes('20:00', '08:00')).toBe(12 * 60);
    expect(
      createShiftSchema.safeParse({ ...valid, startTime: '20:00', endTime: '08:00' }).success,
    ).toBe(true);
  });

  it('refuses visits that are too short', () => {
    expect(createShiftSchema.safeParse({ ...valid, endTime: '08:15' }).success).toBe(false);
  });

  it('limits weekly repeats', () => {
    expect(createShiftSchema.safeParse({ ...valid, repeatWeeks: 20 }).success).toBe(false);
  });
});
