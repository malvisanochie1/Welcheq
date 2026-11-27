export const DEMO_PERSONA = {
  FAMILY: 'family',
  CAREGIVER: 'caregiver',
} as const;

export type DemoPersona = (typeof DEMO_PERSONA)[keyof typeof DEMO_PERSONA];

/** Sign-in emails for the two shared demo accounts; the reserved domain can never receive mail. */
export const DEMO_EMAILS: Readonly<Record<DemoPersona, string>> = {
  [DEMO_PERSONA.FAMILY]: 'family@demo.welcheq.example',
  [DEMO_PERSONA.CAREGIVER]: 'caregiver@demo.welcheq.example',
};

/** Demo people who never sign in, so they have fixed ids instead of sign-in accounts. */
export const DEMO_EXTRA_PEOPLE = {
  SIBLING: { id: '6f1d2c4e-1a2b-4c3d-8e9f-000000000001', fullName: 'Emeka Okafor' },
  SECOND_CAREGIVER: { id: '6f1d2c4e-1a2b-4c3d-8e9f-000000000002', fullName: 'Tunde Bello' },
} as const;

export const DEMO_RULES = {
  TIME_ZONE: 'Africa/Lagos',
  HISTORY_DAYS: 14,
  UPCOMING_DAYS: 3,
  RESEED_AFTER_HOURS: 20,
  SEED_ROW_ID: 1,
  /** Any fixed number works: it only keeps two first visitors from building the demo at once. */
  SEED_LOCK_KEY: 4_242_026,
} as const;

export const DEMO_READ_ONLY_MESSAGE =
  'This is a demo, so changes are switched off. Create a free account to try everything.';
