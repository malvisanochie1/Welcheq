import { USER_ROLE, type SelfAssignableRole } from '@welcheq/shared';

export interface RoleOption {
  role: SelfAssignableRole;
  title: string;
  description: string;
}

export const SIGN_UP_ROLE_OPTIONS: readonly RoleOption[] = [
  {
    role: USER_ROLE.FAMILY,
    title: 'I look after a loved one',
    description: 'Set up their care, invite caregivers and follow every visit.',
  },
  {
    role: USER_ROLE.CAREGIVER,
    title: 'I am a caregiver',
    description: 'See your visits, check in and record the care you give.',
  },
  {
    role: USER_ROLE.AGENCY_ADMIN,
    title: 'I run a care agency',
    description: 'Manage your caregivers, clients and schedules in one place.',
  },
];
