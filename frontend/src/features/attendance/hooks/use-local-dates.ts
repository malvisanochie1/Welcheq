import { addDays, DEFAULT_PATIENT_TIME_ZONE, localMoment } from '@welcheq/shared';
import { useMemo } from 'react';

import type { DateRange } from '../api/attendance.api';

export function useLocalToday(timeZone = DEFAULT_PATIENT_TIME_ZONE): string {
  return localMoment(new Date(), timeZone).date;
}

export function useDateRange(daysBack: number, daysAhead: number, timeZone?: string): DateRange {
  const today = useLocalToday(timeZone);
  return useMemo(
    () => ({ from: addDays(today, -daysBack), to: addDays(today, daysAhead) }),
    [today, daysBack, daysAhead],
  );
}
