import { router } from 'expo-router';

import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { SignInForm } from '@/features/auth/components/SignInForm';

export default function SignInScreen() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to see how your loved one is doing."
      footer={
        <Button
          label="New to Welcheq? Create an account"
          variant="ghost"
          onPress={() => router.replace('/sign-up')}
        />
      }
    >
      <SignInForm />
    </AuthLayout>
  );
}
