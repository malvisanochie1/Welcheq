import { describe, expect, it } from 'vitest';

import { GEOFENCE, PROOF_METHOD } from '../constants/proof';
import { proofSettingsSchema } from './proof-settings.schema';

const validSettings = {
  methods: [PROOF_METHOD.LOCATION, PROOF_METHOD.SELFIE],
  geofenceRadiusMeters: GEOFENCE.DEFAULT_RADIUS_METERS,
};

describe('proofSettingsSchema', () => {
  it('accepts location plus optional checks', () => {
    expect(proofSettingsSchema.safeParse(validSettings).success).toBe(true);
  });

  it('refuses settings without the location check', () => {
    const result = proofSettingsSchema.safeParse({
      ...validSettings,
      methods: [PROOF_METHOD.SELFIE],
    });
    expect(result.success).toBe(false);
  });

  it('refuses duplicated checks', () => {
    const result = proofSettingsSchema.safeParse({
      ...validSettings,
      methods: [PROOF_METHOD.LOCATION, PROOF_METHOD.LOCATION],
    });
    expect(result.success).toBe(false);
  });

  it('refuses a radius outside the allowed range', () => {
    const result = proofSettingsSchema.safeParse({ ...validSettings, geofenceRadiusMeters: 5_000 });
    expect(result.success).toBe(false);
  });

  it('refuses unknown fields', () => {
    const result = proofSettingsSchema.safeParse({ ...validSettings, verified: true });
    expect(result.success).toBe(false);
  });
});
