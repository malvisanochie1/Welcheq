import type { CareRelationship } from '@welcheq/shared';

import { HttpError } from '@/lib/http-error';
import type { ActingUser } from '@/middleware/require-profile';
import { patientRepository } from './patient.repository';

/**
 * Patients the user cannot see answer as not found, so ids cannot be probed to learn
 * which patients exist.
 */
export async function requirePatientAccess(
  user: ActingUser,
  patientId: string,
  allowed?: readonly CareRelationship[],
): Promise<CareRelationship> {
  const access = await patientRepository.findAccess(user.id, patientId);

  if (!access) {
    throw HttpError.notFound('Patient not found');
  }
  if (allowed && !allowed.includes(access.relationship)) {
    throw HttpError.forbidden('Only the family member who manages this patient can do this');
  }

  return access.relationship;
}
