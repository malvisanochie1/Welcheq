import type { SignInInput } from '@welcheq/shared';

/** Browsers have no secure biometric store, so fingerprint sign-in is a mobile-only feature. */
export const biometricCredentials = {
  isAvailable: async (): Promise<boolean> => false,
  enrolledEmail: async (): Promise<string | null> => null,
  confirmIdentity: async (): Promise<boolean> => false,
  enroll: async (_credentials: SignInInput): Promise<void> => undefined,
  read: async (): Promise<SignInInput | null> => null,
  remove: async (): Promise<void> => undefined,
};
