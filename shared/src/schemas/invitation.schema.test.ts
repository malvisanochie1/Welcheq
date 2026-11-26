import { describe, expect, it } from 'vitest';

import {
  acceptInvitationSchema,
  createInvitationSchema,
  formatInvitationCode,
} from './invitation.schema';

describe('invitation codes', () => {
  it('accepts codes typed with spaces, dashes or lower case', () => {
    const parsed = acceptInvitationSchema.parse({ code: 'wq7k-3m9p' });
    expect(parsed.code).toBe('WQ7K3M9P');
  });

  it('refuses characters that are easy to misread', () => {
    expect(acceptInvitationSchema.safeParse({ code: 'WQ7K-3M0O' }).success).toBe(false);
  });

  it('refuses codes of the wrong length', () => {
    expect(acceptInvitationSchema.safeParse({ code: 'WQ7K' }).success).toBe(false);
  });

  it('formats codes in groups for reading aloud', () => {
    expect(formatInvitationCode('WQ7K3M9P')).toBe('WQ7K-3M9P');
  });
});

describe('createInvitationSchema', () => {
  it('only invites caregivers and family viewers', () => {
    expect(createInvitationSchema.safeParse({ relationship: 'CAREGIVER' }).success).toBe(true);
    expect(createInvitationSchema.safeParse({ relationship: 'OWNER' }).success).toBe(false);
  });
});
