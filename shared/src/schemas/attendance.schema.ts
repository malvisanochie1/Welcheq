import { z } from 'zod';

import { ATTENDANCE_RULES } from '../constants/attendance';
import { ROTATING_CODE } from '../constants/proof';
import { MINUTES_PER_DAY } from '../constants/care-plan';
import { parseClockTime } from '../care-plan/clock';
import { clockTimeSchema } from './care-plan.schema';
import { geoPointSchema, idSchema } from './common.schema';

const MAX_REPORTED_ACCURACY_METERS = 5_000;
const SELFIE_PATH_MAX_LENGTH = 200;

export function shiftDurationMinutes(startTime: string, endTime: string): number | null {
  const start = parseClockTime(startTime);
  const end = parseClockTime(endTime);
  if (start === null || end === null) return null;
  return end > start ? end - start : end + MINUTES_PER_DAY - start;
}

export const createShiftSchema = z
  .strictObject({
    caregiverId: idSchema,
    date: z.iso.date(),
    startTime: clockTimeSchema,
    endTime: clockTimeSchema,
    repeatWeeks: z.number().int().min(0).max(ATTENDANCE_RULES.MAX_REPEAT_WEEKS).default(0),
  })
  .refine(
    ({ startTime, endTime }) => {
      const duration = shiftDurationMinutes(startTime, endTime);
      return (
        duration !== null &&
        duration >= ATTENDANCE_RULES.MIN_SHIFT_MINUTES &&
        duration <= ATTENDANCE_RULES.MAX_SHIFT_MINUTES
      );
    },
    { message: 'A visit must last between 30 minutes and 16 hours', path: ['endTime'] },
  );

export type CreateShiftInput = z.input<typeof createShiftSchema>;

export const scheduleRangeSchema = z
  .object({ from: z.iso.date(), to: z.iso.date() })
  .refine(({ from, to }) => from <= to, 'The range must end after it starts')
  .refine(
    ({ from, to }) =>
      (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000 <=
      ATTENDANCE_RULES.MAX_SCHEDULE_RANGE_DAYS,
    'Choose a shorter range',
  );

export const locationReadingSchema = geoPointSchema.extend({
  accuracyMeters: z.number().min(0).max(MAX_REPORTED_ACCURACY_METERS),
  isMocked: z.boolean().default(false),
});

export type LocationReading = z.input<typeof locationReadingSchema>;

export const attendanceEventSchema = z.strictObject({
  location: locationReadingSchema,
  capturedAt: z.iso.datetime({ offset: true }),
  isOffline: z.boolean().default(false),
  homeCode: z
    .string()
    .regex(new RegExp(`^\\d{${ROTATING_CODE.DIGITS}}$`), 'Enter the 6-digit code shown at the home')
    .optional(),
  selfiePath: z.string().max(SELFIE_PATH_MAX_LENGTH).optional(),
});

export const surpriseCheckResponseSchema = z.strictObject({
  location: locationReadingSchema,
  capturedAt: z.iso.datetime({ offset: true }),
});

export type SurpriseCheckResponseInput = z.input<typeof surpriseCheckResponseSchema>;

export type AttendanceEventInput = z.input<typeof attendanceEventSchema>;
