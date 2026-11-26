const MINUTE_MS = 60_000;

/** Offset of a time zone from UTC, in minutes, at the given instant. */
function offsetMinutes(instant: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(instant)
      .map(({ type, value }) => [type, Number(value)]),
  );
  const asUtc = Date.UTC(
    parts.year as number,
    (parts.month as number) - 1,
    parts.day as number,
    parts.hour as number,
    parts.minute as number,
    parts.second as number,
  );
  return Math.round((asUtc - instant.getTime()) / MINUTE_MS);
}

/** Converts a local calendar date and time in a time zone to the matching instant. */
export function zonedDateTimeToInstant(
  isoDate: string,
  minutesAfterMidnight: number,
  timeZone: string,
): Date {
  const naiveUtc = new Date(`${isoDate}T00:00:00Z`).getTime() + minutesAfterMidnight * MINUTE_MS;
  const firstGuess = naiveUtc - offsetMinutes(new Date(naiveUtc), timeZone) * MINUTE_MS;
  return new Date(naiveUtc - offsetMinutes(new Date(firstGuess), timeZone) * MINUTE_MS);
}
