import { BRAND } from './brand';

export interface PolicySection {
  heading: string;
  paragraphs: readonly string[];
}

export const PRIVACY_POLICY: readonly PolicySection[] = [
  {
    heading: 'What we collect',
    paragraphs: [
      'Your name, email, phone number if you add it, and your role. For each person you care for: their name, home address and location, date of birth if added, care plan, visits, readings, health record, incidents and messages written by their care team.',
      'When a caregiver checks in or out, the phone location at that moment, and a selfie if the family switched selfies on. Location is never tracked in the background.',
    ],
  },
  {
    heading: 'Why we use it',
    paragraphs: [
      `Only to run ${BRAND.NAME}: to show the family that care happened, help caregivers do their work and keep the health record in one place. We do not sell data, show adverts or share it with anyone outside the care team.`,
    ],
  },
  {
    heading: 'Who can see it',
    paragraphs: [
      "Only people the family has invited to that person's care team. Each person sees only what their role needs, and every change to important records is logged.",
    ],
  },
  {
    heading: 'Where it is kept and how it is protected',
    paragraphs: [
      "Data is stored with Supabase and processed by our server on Render. It is encrypted in transit, sign-in tokens stay in the phone's secure storage, and photos are private and shown only through short-lived links.",
    ],
  },
  {
    heading: 'Deleting your data',
    paragraphs: [
      'You can delete your account at any time in Settings. Your personal details are removed, and anyone you are the owner for is deleted with their records. Visits you recorded for other families stay in their history without your name.',
    ],
  },
  {
    heading: 'Contact',
    paragraphs: [`Questions about your data: ${BRAND.SUPPORT_EMAIL}.`],
  },
];
