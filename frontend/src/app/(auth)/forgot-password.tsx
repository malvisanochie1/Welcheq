import { router } from 'expo-router';

import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

export default function ForgotPasswordScreen() {
  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to choose a new one."
      footer={
        <Button
          label="Back to sign in"
          variant="ghost"
          onPress={() => router.replace('/sign-in')}
        />
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
