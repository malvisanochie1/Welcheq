import { z } from 'zod';

import {
  INCIDENT_CATEGORY,
  INCIDENT_SEVERITY,
  READING_SPECS,
  READING_TYPE,
  READING_TYPES,
  REPORT_RULES,
  WELLBEING,
} from '../constants/health';

export const readingInputSchema = z
  .strictObject({
    type: z.enum(READING_TYPES),
    value: z.number().finite(),
    secondaryValue: z.number().finite().optional(),
    measuredAt: z.iso.datetime({ offset: true }).optional(),
  })
  .superRefine((reading, context) => {
    const spec = READING_SPECS[reading.type];
    if (reading.value < spec.min || reading.value > spec.max) {
      context.addIssue({
        code: 'custom',
        path: ['value'],
        message: `Check this value. It should be between ${spec.min} and ${spec.max} ${spec.unit}.`,
      });
    }

    const isBloodPressure = reading.type === READING_TYPE.BLOOD_PRESSURE;
    if (isBloodPressure !== (reading.secondaryValue !== undefined)) {
      context.addIssue({
        code: 'custom',
        path: ['secondaryValue'],
        message: isBloodPressure
          ? 'Enter both numbers of the blood pressure'
          : 'Only blood pressure has a second number',
      });
      return;
    }

    if (spec.secondary && reading.secondaryValue !== undefined) {
      const { min, max } = spec.secondary;
      if (reading.secondaryValue < min || reading.secondaryValue > max) {
        context.addIssue({
          code: 'custom',
          path: ['secondaryValue'],
          message: `Check the lower number. It should be between ${min} and ${max}.`,
        });
      }
      if (reading.secondaryValue >= reading.value) {
        context.addIssue({
          code: 'custom',
          path: ['secondaryValue'],
          message: 'The first number should be the higher one, for example 130/85.',
        });
      }
    }
  });

export type ReadingInput = z.infer<typeof readingInputSchema>;

export const visitReportSchema = z.strictObject({
  wellbeing: z.enum(Object.values(WELLBEING)),
  notes: z.string().trim().max(REPORT_RULES.NOTES_MAX_LENGTH).optional(),
  readings: z.array(readingInputSchema).max(REPORT_RULES.MAX_READINGS_PER_REPORT).default([]),
});

export type VisitReportInput = z.input<typeof visitReportSchema>;

export const readingQuerySchema = z.object({
  type: z.enum(READING_TYPES).optional(),
  from: z.iso.date(),
  to: z.iso.date(),
});

export const incidentInputSchema = z.strictObject({
  category: z.enum(Object.values(INCIDENT_CATEGORY)),
  severity: z.enum(Object.values(INCIDENT_SEVERITY)),
  description: z
    .string()
    .trim()
    .min(REPORT_RULES.INCIDENT_MIN_LENGTH, 'Describe what happened in a sentence or two')
    .max(REPORT_RULES.NOTES_MAX_LENGTH),
  occurredAt: z.iso.datetime({ offset: true }),
});

export type IncidentInput = z.infer<typeof incidentInputSchema>;

export const resolveIncidentSchema = z.strictObject({
  resolutionNote: z
    .string()
    .trim()
    .min(REPORT_RULES.INCIDENT_MIN_LENGTH, 'Say how it was handled')
    .max(REPORT_RULES.NOTES_MAX_LENGTH),
});
