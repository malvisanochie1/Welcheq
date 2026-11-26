import { router } from 'expo-router';

import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { SignUpForm } from '@/features/auth/components/SignUpForm';

export default function SignUpScreen() {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes less than a minute."
      footer={
        <Button
          label="Already have an account? Sign in"
          variant="ghost"
          onPress={() => router.replace('/sign-in')}
        />
      }
    >
      <SignUpForm />
    </AuthLayout>
  );
}
