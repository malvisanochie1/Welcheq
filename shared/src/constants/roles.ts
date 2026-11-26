export const USER_ROLE = {
  FAMILY: 'FAMILY',
  CAREGIVER: 'CAREGIVER',
  PATIENT: 'PATIENT',
  AGENCY_ADMIN: 'AGENCY_ADMIN',
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const USER_ROLES = Object.values(USER_ROLE);

export const SELF_ASSIGNABLE_ROLES = [
  USER_ROLE.FAMILY,
  USER_ROLE.CAREGIVER,
  USER_ROLE.AGENCY_ADMIN,
] as const satisfies readonly UserRole[];

export type SelfAssignableRole = (typeof SELF_ASSIGNABLE_ROLES)[number];

export const CARE_RELATIONSHIP = {
  OWNER: 'OWNER',
  FAMILY_VIEWER: 'FAMILY_VIEWER',
  CAREGIVER: 'CAREGIVER',
  SELF: 'SELF',
} as const;

export type CareRelationship = (typeof CARE_RELATIONSHIP)[keyof typeof CARE_RELATIONSHIP];

export const CARE_RELATIONSHIPS = Object.values(CARE_RELATIONSHIP);

export const PATIENT_MANAGER_ROLES = [
  USER_ROLE.FAMILY,
  USER_ROLE.AGENCY_ADMIN,
] as const satisfies readonly UserRole[];

export const PATIENT_EDITOR_RELATIONSHIPS = [
  CARE_RELATIONSHIP.OWNER,
] as const satisfies readonly CareRelationship[];

export const TASK_RECORDER_RELATIONSHIPS = [
  CARE_RELATIONSHIP.OWNER,
  CARE_RELATIONSHIP.CAREGIVER,
] as const satisfies readonly CareRelationship[];
