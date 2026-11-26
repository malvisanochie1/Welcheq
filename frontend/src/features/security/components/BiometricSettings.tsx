import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { SwitchRow } from '@/components/ui/SwitchRow';
import { TextField } from '@/components/ui/TextField';
import { AuthError } from '@/features/auth/api/auth.api';
import { useBiometricEnrollment } from '../hooks/use-biometric-enrollment';

const DESCRIPTION = {
  available: 'Use your fingerprint instead of typing your password.',
  unavailable: 'Set up a fingerprint in your phone settings to use this.',
  checking: '',
} as const;

export function BiometricSettings() {
  const { availability, isEnabled, enable, disable } = useBiometricEnrollment();
  const [isConfirming, setIsConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const toggle = async (shouldEnable: boolean) => {
    setErrorMessage(null);
    if (shouldEnable) {
      setIsConfirming(true);
      return;
    }
    setIsConfirming(false);
    await disable();
  };

  const confirm = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await enable(password);
      setIsConfirming(false);
      setPassword('');
    } catch (error) {
      setErrorMessage(error instanceof AuthError ? error.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="gap-4">
      <SwitchRow
        title="Fingerprint sign-in"
        description={DESCRIPTION[availability]}
        value={isEnabled || isConfirming}
        onValueChange={toggle}
        isDisabled={availability !== 'available'}
      />
      {isConfirming && (
        <View className="gap-4">
          {errorMessage && <FormMessage message={errorMessage} />}
          <TextField
            label="Confirm your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={confirm}
          />
          <Button label="Turn on fingerprint sign-in" onPress={confirm} isLoading={isSaving} />
        </View>
      )}
    </View>
  );
}
