import { z } from 'zod';

import { TEXT_LIMIT } from '../constants/limits';
import { GEOFENCE, PROOF_METHOD } from '../constants/proof';
import { geoPointSchema, personNameSchema } from './common.schema';
import { proofSettingsSchema } from './proof-settings.schema';

const EARLIEST_BIRTH_YEAR = 1900;

export const dateOfBirthSchema = z.iso
  .date('Use the format YYYY-MM-DD')
  .refine((value) => Number(value.slice(0, 4)) >= EARLIEST_BIRTH_YEAR, 'Check the year of birth')
  .refine((value) => new Date(value) <= new Date(), 'Date of birth cannot be in the future');

export const homeAddressSchema = z
  .string()
  .trim()
  .min(5, 'Enter the full home address')
  .max(TEXT_LIMIT.ADDRESS, 'This address is too long');

export const DEFAULT_PROOF_SETTINGS = {
  methods: [PROOF_METHOD.LOCATION],
  geofenceRadiusMeters: GEOFENCE.DEFAULT_RADIUS_METERS,
} as const;

export const createPatientSchema = z.strictObject({
  fullName: personNameSchema,
  dateOfBirth: dateOfBirthSchema.optional(),
  homeAddress: homeAddressSchema,
  homeLocation: geoPointSchema,
  proofSettings: proofSettingsSchema.default({
    methods: [...DEFAULT_PROOF_SETTINGS.methods],
    geofenceRadiusMeters: DEFAULT_PROOF_SETTINGS.geofenceRadiusMeters,
  }),
});

export type CreatePatientInput = z.input<typeof createPatientSchema>;

export const updatePatientSchema = z
  .strictObject({
    fullName: personNameSchema,
    dateOfBirth: dateOfBirthSchema.nullable(),
    homeAddress: homeAddressSchema,
    homeLocation: geoPointSchema,
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Nothing to update');

export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
