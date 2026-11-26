import { useCallback, useEffect, useState } from 'react';

import { useSessionStore } from '@/features/auth/stores/session.store';
import { verifyCurrentPassword } from '@/features/auth/api/auth.api';
import { biometricCredentials } from '../lib/biometric-credentials';

export type BiometricAvailability = 'checking' | 'unavailable' | 'available';

export function useBiometricEnrollment() {
  const email = useSessionStore((state) => state.session?.user.email);
  const [availability, setAvailability] = useState<BiometricAvailability>('checking');
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([biometricCredentials.isAvailable(), biometricCredentials.enrolledEmail()])
      .then(([isAvailable, enrolledEmail]) => {
        if (!isMounted) return;
        setAvailability(isAvailable ? 'available' : 'unavailable');
        setIsEnabled(Boolean(email) && enrolledEmail === email);
      })
      .catch(() => isMounted && setAvailability('unavailable'));
    return () => {
      isMounted = false;
    };
  }, [email]);

  const enable = useCallback(async (password: string) => {
    const credentials = await verifyCurrentPassword(password);
    await biometricCredentials.enroll(credentials);
    setIsEnabled(true);
  }, []);

  const disable = useCallback(async () => {
    await biometricCredentials.remove();
    setIsEnabled(false);
  }, []);

  return { availability, isEnabled, enable, disable };
}
