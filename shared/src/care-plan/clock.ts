import { MINUTES_PER_DAY } from '../constants/care-plan';

export interface LocalMoment {
  /** ISO calendar date in the given time zone, e.g. 2026-11-26. */
  date: string;
  /** Minutes since local midnight. */
  minutes: number;
  /** 0 = Sunday … 6 = Saturday. */
  dayOfWeek: number;
}

export function localMoment(instant: Date, timeZone: string): LocalMoment {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(instant)
      .map(({ type, value }) => [type, value]),
  );

  const date = `${parts.year}-${parts.month}-${parts.day}`;
  return {
    date,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    dayOfWeek: dayOfWeekFor(date),
  };
}

export function dayOfWeekFor(isoDate: string): number {
  return new Date(`${isoDate}T00:00:00Z`).getUTCDay();
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatClockTime(minutesAfterMidnight: number): string {
  const normalized = ((minutesAfterMidnight % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = String(Math.floor(normalized / 60)).padStart(2, '0');
  const minutes = String(normalized % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function parseClockTime(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}
