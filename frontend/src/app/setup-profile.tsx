import { AuthLayout } from '@/components/layout/AuthLayout';
import { ProfileSetupForm } from '@/features/auth/components/ProfileSetupForm';

export default function SetupProfileScreen() {
  return (
    <AuthLayout title="Tell us about you" subtitle="This shapes what you see in Welcheq.">
      <ProfileSetupForm />
    </AuthLayout>
  );
}
