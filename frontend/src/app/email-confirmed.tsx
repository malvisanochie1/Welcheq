import { router } from 'expo-router';
import { useState } from 'react';
import { Platform } from 'react-native';

import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Text } from '@/components/ui/Text';
import { BRAND } from '@/config/brand';
import { emailLinkError } from '@/features/auth/lib/email-link-error';

function readLinkError(): string | null {
  if (Platform.OS !== 'web') return null;
  return emailLinkError(window.location.hash, window.location.search);
}

export default function EmailConfirmedScreen() {
  const [error] = useState(readLinkError);

  if (error) {
    return (
      <AuthLayout title="Let's try that again">
        <FormMessage message={error} />
        <Button label="Go to sign in" onPress={() => router.replace('/sign-in')} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Email confirmed" subtitle={`Your ${BRAND.NAME} account is ready.`}>
      <Text variant="body" className="text-ink-muted">
        If you signed up in the app on your phone, go back to it and sign in. You can also carry on
        here.
      </Text>
      <Button label="Continue" onPress={() => router.replace('/')} />
    </AuthLayout>
  );
}
