import { useCallback, useEffect, useState } from 'react';

import { AuthError, signInWithPassword } from '@/features/auth/api/auth.api';
import { biometricCredentials } from '../lib/biometric-credentials';

const STALE_CREDENTIALS_MESSAGE =
  'Your password has changed. Sign in with it once to use your fingerprint again.';

export function useBiometricSignIn() {
  const [enrolledEmail, setEnrolledEmail] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([biometricCredentials.isAvailable(), biometricCredentials.enrolledEmail()])
      .then(([isAvailable, email]) => {
        if (isMounted) setEnrolledEmail(isAvailable ? email : null);
      })
      .catch(() => undefined);
    return () => {
      isMounted = false;
    };
  }, []);

  const signInWithBiometrics = useCallback(async (): Promise<boolean> => {
    const credentials = await biometricCredentials.read().catch(() => null);
    if (!credentials) {
      return false;
    }

    try {
      await signInWithPassword(credentials);
      return true;
    } catch {
      await biometricCredentials.remove();
      setEnrolledEmail(null);
      throw new AuthError(STALE_CREDENTIALS_MESSAGE);
    }
  }, []);

  return { isEnabled: enrolledEmail !== null, enrolledEmail, signInWithBiometrics };
}
