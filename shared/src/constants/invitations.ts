import { CARE_RELATIONSHIP, USER_ROLE, type CareRelationship, type UserRole } from './roles';

export const INVITATION_CODE = {
  LENGTH: 8,
  GROUP_SIZE: 4,
  /** Leaves out 0/O and 1/I/L so codes read clearly over the phone. */
  ALPHABET: '23456789ABCDEFGHJKMNPQRSTUVWXYZ',
} as const;

export const INVITATION_EXPIRY_DAYS = 7;

export const INVITABLE_RELATIONSHIPS = [
  CARE_RELATIONSHIP.CAREGIVER,
  CARE_RELATIONSHIP.FAMILY_VIEWER,
] as const satisfies readonly CareRelationship[];

export type InvitableRelationship = (typeof INVITABLE_RELATIONSHIPS)[number];

export const ROLE_REQUIRED_FOR_RELATIONSHIP: Readonly<Record<InvitableRelationship, UserRole>> = {
  [CARE_RELATIONSHIP.CAREGIVER]: USER_ROLE.CAREGIVER,
  [CARE_RELATIONSHIP.FAMILY_VIEWER]: USER_ROLE.FAMILY,
};
