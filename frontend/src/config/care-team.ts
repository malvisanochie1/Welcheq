import {
  CARE_RELATIONSHIP,
  INVITATION_EXPIRY_DAYS,
  type CareRelationship,
  type InvitableRelationship,
} from '@welcheq/shared';

export const RELATIONSHIP_LABEL: Readonly<Record<CareRelationship, string>> = {
  [CARE_RELATIONSHIP.OWNER]: 'Manages care',
  [CARE_RELATIONSHIP.FAMILY_VIEWER]: 'Family',
  [CARE_RELATIONSHIP.CAREGIVER]: 'Caregiver',
  [CARE_RELATIONSHIP.SELF]: 'Patient',
};

export const INVITE_COPY: Readonly<
  Record<InvitableRelationship, { action: string; title: string; explanation: string }>
> = {
  [CARE_RELATIONSHIP.CAREGIVER]: {
    action: 'Invite a caregiver',
    title: 'Invite a caregiver',
    explanation:
      'They will see this person’s daily checklist and check in at the home. They will not see your phone number.',
  },
  [CARE_RELATIONSHIP.FAMILY_VIEWER]: {
    action: 'Invite family',
    title: 'Invite a family member',
    explanation: 'They will follow visits and reports, but cannot change settings or the team.',
  },
};

export function invitationShareMessage(patientName: string, code: string): string {
  return [
    `I've added you to ${patientName}'s care team on Welcheq.`,
    `Open Welcheq, tap "Join with a code" and enter: ${code}`,
    `The code works once and expires in ${INVITATION_EXPIRY_DAYS} days.`,
  ].join('\n\n');
}
