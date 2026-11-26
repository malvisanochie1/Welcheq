import { z } from 'zod';

import { GEOFENCE, MANDATORY_PROOF_METHODS, PROOF_METHODS } from '../constants/proof';

export const proofSettingsSchema = z
  .strictObject({
    methods: z.array(z.enum(PROOF_METHODS)).min(1).max(PROOF_METHODS.length),
    geofenceRadiusMeters: z
      .number()
      .int()
      .min(GEOFENCE.MIN_RADIUS_METERS)
      .max(GEOFENCE.MAX_RADIUS_METERS),
  })
  .refine(({ methods }) => MANDATORY_PROOF_METHODS.every((method) => methods.includes(method)), {
    message: 'Location check cannot be turned off',
    path: ['methods'],
  })
  .refine(({ methods }) => new Set(methods).size === methods.length, {
    message: 'Each check can only be listed once',
    path: ['methods'],
  });

export type ProofSettingsInput = z.infer<typeof proofSettingsSchema>;
