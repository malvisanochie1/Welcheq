import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { TextField } from '@/components/ui/TextField';
import { ApiError } from '@/lib/api-client';
import { AuthError, confirmPassword, signOut } from '../api/auth.api';
import { profileApi } from '../api/profile.api';
import { PasswordVisibilityToggle } from './PasswordVisibilityToggle';

export function DeleteAccountForm({ email }: { email: string }) {
  const [password, setPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const submit = async () => {
    if (!password) {
      setError('Enter your password to confirm.');
      return;
    }
    setError(null);
    setIsDeleting(true);
    try {
      await confirmPassword(email, password);
      await profileApi.deleteOwn();
      await signOut();
    } catch (caught) {
      setError(
        caught instanceof AuthError || caught instanceof ApiError
          ? caught.message
          : 'Please try again.',
      );
      setIsDeleting(false);
    }
  };

  return (
    <View className="gap-5">
      {error && <FormMessage message={error} />}
      <TextField
        label="Your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!isVisible}
        autoComplete="current-password"
        textContentType="password"
        trailing={
          <PasswordVisibilityToggle
            isVisible={isVisible}
            onToggle={() => setIsVisible((v) => !v)}
          />
        }
      />
      <Button
        label="Delete my account for good"
        variant="danger"
        onPress={submit}
        isLoading={isDeleting}
      />
    </View>
  );
}
