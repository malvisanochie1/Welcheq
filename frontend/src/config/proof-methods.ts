import { GEOFENCE, PROOF_METHOD, type ProofMethod } from '@welcheq/shared';

export interface ProofMethodOption {
  method: ProofMethod;
  title: string;
  description: string;
}

export const PROOF_METHOD_OPTIONS: readonly ProofMethodOption[] = [
  {
    method: PROOF_METHOD.LOCATION,
    title: 'Location check',
    description: 'Check-in only works at the home. Always on.',
  },
  {
    method: PROOF_METHOD.SELFIE,
    title: 'Selfie at check-in',
    description: 'A photo taken in the app, stamped with the time.',
  },
  {
    method: PROOF_METHOD.ROTATING_CODE,
    title: 'Code on a home device',
    description: 'A spare phone or tablet at home shows a code that changes every minute.',
  },
  {
    method: PROOF_METHOD.SURPRISE_CHECK,
    title: 'Surprise check',
    description: 'Once a visit, at a random time, the caregiver confirms they are still there.',
  },
];

export const GEOFENCE_RADIUS_CHOICES = [
  { meters: GEOFENCE.MIN_RADIUS_METERS, label: 'Strict', hint: 'Small compound or flat' },
  { meters: GEOFENCE.DEFAULT_RADIUS_METERS, label: 'Standard', hint: 'Most homes' },
  { meters: 300, label: 'Relaxed', hint: 'Large compound or weak GPS' },
] as const;
