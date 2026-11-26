import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { AuthError, signOut, verifyCurrentPassword } from '@/features/auth/api/auth.api';
import { PasswordVisibilityToggle } from '@/features/auth/components/PasswordVisibilityToggle';
import { useBiometricEnrollment } from '../hooks/use-biometric-enrollment';
import { biometricCredentials } from '../lib/biometric-credentials';
import { useAppLockStore } from '../stores/app-lock.store';

const LOCK_LAYER = 60;

export interface LockScreenProps {
  firstName?: string;
}

export function LockScreen({ firstName }: LockScreenProps) {
  const unlock = useAppLockStore((state) => state.unlock);
  const { isEnabled: isBiometricEnabled } = useBiometricEnrollment();
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const unlockWithFingerprint = useCallback(async () => {
    if (await biometricCredentials.confirmIdentity()) {
      unlock();
    }
  }, [unlock]);

  useEffect(() => {
    if (isBiometricEnabled) {
      unlockWithFingerprint();
    }
  }, [isBiometricEnabled, unlockWithFingerprint]);

  const unlockWithPassword = async () => {
    if (!password) {
      setErrorMessage('Enter your password to continue.');
      return;
    }

    setErrorMessage(null);
    setIsVerifying(true);
    try {
      await verifyCurrentPassword(password);
      unlock();
    } catch (error) {
      setErrorMessage(error instanceof AuthError ? error.message : 'Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <View
      className="absolute inset-0 bg-canvas"
      style={{ zIndex: LOCK_LAYER, elevation: LOCK_LAYER }}
      accessibilityViewIsModal
    >
      <Screen contentClassName="justify-center gap-8">
        <View className="gap-2">
          <Text variant="title">{firstName ? `Welcome back, ${firstName}` : 'Welcome back'}</Text>
          <Text variant="caption">
            Welcheq locked itself to keep your family's details private.
          </Text>
        </View>

        {errorMessage && <FormMessage message={errorMessage} />}

        <View className="gap-4">
          {isBiometricEnabled && (
            <Button label="Unlock with fingerprint" onPress={unlockWithFingerprint} />
          )}
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={unlockWithPassword}
            trailing={
              <PasswordVisibilityToggle
                isVisible={isPasswordVisible}
                onToggle={() => setIsPasswordVisible((visible) => !visible)}
              />
            }
          />
          <Button
            label="Unlock"
            variant={isBiometricEnabled ? 'secondary' : 'primary'}
            onPress={unlockWithPassword}
            isLoading={isVerifying}
          />
        </View>

        <Button label="Sign out" variant="ghost" onPress={signOut} />
      </Screen>
    </View>
  );
}
