import { createHash, randomBytes, randomInt } from 'node:crypto';

import { INVITATION_CODE } from '@welcheq/shared';

export function generateInvitationCode(): string {
  return Array.from(
    { length: INVITATION_CODE.LENGTH },
    () => INVITATION_CODE.ALPHABET[randomInt(INVITATION_CODE.ALPHABET.length)],
  ).join('');
}

/** Only the hash is stored, so a database leak does not reveal usable codes. */
export function hashInvitationCode(normalizedCode: string): string {
  return createHash('sha256').update(normalizedCode).digest('hex');
}

const HOME_CODE_SECRET_BYTES = 32;

export function generateHomeCodeSecret(): string {
  return randomBytes(HOME_CODE_SECRET_BYTES).toString('hex');
}

/** A uniformly random number in [0, 1) from the system's secure random source. */
export function secureRandomFraction(): number {
  const SCALE = 2 ** 32;
  return randomBytes(4).readUInt32BE(0) / SCALE;
}
