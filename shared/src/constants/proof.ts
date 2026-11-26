export const PROOF_METHOD = {
  LOCATION: 'LOCATION',
  SELFIE: 'SELFIE',
  ROTATING_CODE: 'ROTATING_CODE',
  SURPRISE_CHECK: 'SURPRISE_CHECK',
} as const;

export type ProofMethod = (typeof PROOF_METHOD)[keyof typeof PROOF_METHOD];

export const PROOF_METHODS = Object.values(PROOF_METHOD);

/**
 * Location is the floor of attendance proof: families may add checks but never remove this one,
 * so no check-in can ever be fully unverified.
 */
export const MANDATORY_PROOF_METHODS: readonly ProofMethod[] = [PROOF_METHOD.LOCATION];

export const GEOFENCE = {
  DEFAULT_RADIUS_METERS: 150,
  MIN_RADIUS_METERS: 50,
  MAX_RADIUS_METERS: 500,
  MAX_ACCEPTED_ACCURACY_METERS: 100,
} as const;

export const ROTATING_CODE = {
  PERIOD_SECONDS: 60,
  DIGITS: 6,
  ACCEPTED_DRIFT_PERIODS: 1,
} as const;

export const OFFLINE_SYNC = {
  MAX_CLOCK_SKEW_SECONDS: 300,
  MAX_OFFLINE_AGE_HOURS: 24,
} as const;
