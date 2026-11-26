import { createHash, randomInt } from 'node:crypto';

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
