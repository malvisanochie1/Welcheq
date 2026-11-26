import { describe, expect, it } from 'vitest';

import { PROOF_METHOD } from '../constants/proof';
import { createPatientSchema, updatePatientSchema } from './patient.schema';

const validPatient = {
  fullName: 'Ngozi Okafor',
  homeAddress: '12 Ogui Road, Enugu',
  homeLocation: { latitude: 6.4413, longitude: 7.4988 },
};

describe('createPatientSchema', () => {
  it('applies location-only proof by default', () => {
    const parsed = createPatientSchema.parse(validPatient);
    expect(parsed.proofSettings.methods).toEqual([PROOF_METHOD.LOCATION]);
  });

  it('accepts a past date of birth', () => {
    expect(
      createPatientSchema.safeParse({ ...validPatient, dateOfBirth: '1948-03-14' }).success,
    ).toBe(true);
  });

  it('refuses a future date of birth', () => {
    expect(
      createPatientSchema.safeParse({ ...validPatient, dateOfBirth: '2999-01-01' }).success,
    ).toBe(false);
  });

  it('refuses coordinates off the globe', () => {
    const result = createPatientSchema.safeParse({
      ...validPatient,
      homeLocation: { latitude: 120, longitude: 7 },
    });
    expect(result.success).toBe(false);
  });

  it('refuses proof settings without location', () => {
    const result = createPatientSchema.safeParse({
      ...validPatient,
      proofSettings: { methods: [PROOF_METHOD.SELFIE], geofenceRadiusMeters: 150 },
    });
    expect(result.success).toBe(false);
  });
});

describe('updatePatientSchema', () => {
  it('refuses an empty update', () => {
    expect(updatePatientSchema.safeParse({}).success).toBe(false);
  });
});
