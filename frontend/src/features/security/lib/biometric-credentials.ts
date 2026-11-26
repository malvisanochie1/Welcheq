import type { SignInInput } from '@welcheq/shared';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const CREDENTIALS_KEY = 'welcheq.biometric.credentials';
const ENROLLED_EMAIL_KEY = 'welcheq.biometric.email';

const PROMPT = {
  promptMessage: 'Sign in to Welcheq',
  cancelLabel: 'Use password',
  disableDeviceFallback: true,
} as const;

/** Credentials sit behind the hardware keystore and are released only after a biometric match. */
const PROTECTED_OPTIONS: SecureStore.SecureStoreOptions = {
  requireAuthentication: true,
  authenticationPrompt: PROMPT.promptMessage,
  keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
};

export const biometricCredentials = {
  async isAvailable(): Promise<boolean> {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && isEnrolled;
  },

  enrolledEmail(): Promise<string | null> {
    return SecureStore.getItemAsync(ENROLLED_EMAIL_KEY);
  },

  async confirmIdentity(): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync(PROMPT);
    return result.success;
  },

  async enroll(credentials: SignInInput): Promise<void> {
    await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(credentials), PROTECTED_OPTIONS);
    await SecureStore.setItemAsync(ENROLLED_EMAIL_KEY, credentials.email);
  },

  async read(): Promise<SignInInput | null> {
    const stored = await SecureStore.getItemAsync(CREDENTIALS_KEY, PROTECTED_OPTIONS);
    return stored ? (JSON.parse(stored) as SignInInput) : null;
  },

  async remove(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(CREDENTIALS_KEY),
      SecureStore.deleteItemAsync(ENROLLED_EMAIL_KEY),
    ]);
  },
};
