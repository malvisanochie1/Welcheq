import { z } from 'zod';

import { INVITABLE_RELATIONSHIPS, INVITATION_CODE } from '../constants/invitations';

const SEPARATORS = /[\s-]/g;
const CODE_PATTERN = new RegExp(`^[${INVITATION_CODE.ALPHABET}]{${INVITATION_CODE.LENGTH}}$`);

export function normalizeInvitationCode(code: string): string {
  return code.replace(SEPARATORS, '').toUpperCase();
}

export function formatInvitationCode(code: string): string {
  const normalized = normalizeInvitationCode(code);
  const groups = normalized.match(new RegExp(`.{1,${INVITATION_CODE.GROUP_SIZE}}`, 'g')) ?? [];
  return groups.join('-');
}

export const invitationCodeSchema = z
  .string()
  .max(INVITATION_CODE.LENGTH * 2)
  .transform(normalizeInvitationCode)
  .refine((code) => CODE_PATTERN.test(code), 'Check the code and try again');

export const createInvitationSchema = z.strictObject({
  relationship: z.enum(INVITABLE_RELATIONSHIPS),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;

export const acceptInvitationSchema = z.strictObject({
  code: invitationCodeSchema,
});

export type AcceptInvitationInput = z.input<typeof acceptInvitationSchema>;
