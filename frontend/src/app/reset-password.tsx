import { router } from 'expo-router';
import { useState } from 'react';
import { Platform } from 'react-native';

import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Text } from '@/components/ui/Text';
import { NewPasswordForm } from '@/features/auth/components/NewPasswordForm';
import { emailLinkError } from '@/features/auth/lib/email-link-error';
import { useSessionStore } from '@/features/auth/stores/session.store';

function readLinkError(): string | null {
  if (Platform.OS !== 'web') return null;
  return emailLinkError(window.location.hash, window.location.search);
}

/** Opened from the reset email: the link signs the person in so they can set a new password. */
export default function ResetPasswordScreen() {
  const [linkError] = useState(readLinkError);
  const status = useSessionStore((state) => state.status);
  const [isSaved, setIsSaved] = useState(false);

  if (isSaved) {
    return (
      <AuthLayout title="Password changed" subtitle="Use your new password from now on.">
        <Text variant="body" className="text-ink-muted">
          If you reset it for the app on your phone, go back to the app and sign in.
        </Text>
        <Button label="Continue" onPress={() => router.replace('/')} />
      </AuthLayout>
    );
  }

  if (linkError || status === 'signed-out') {
    return (
      <AuthLayout title="This link has expired">
        <FormMessage message={linkError ?? 'Reset links work once and only for a short time.'} />
        <Button label="Send a new link" onPress={() => router.replace('/forgot-password')} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="You'll use it to sign in from now on.">
      {status === 'signed-in' && <NewPasswordForm onSaved={() => setIsSaved(true)} />}
    </AuthLayout>
  );
}
