import { AuthLayout } from '@/components/layout/AuthLayout';
import { PairDisplayForm } from '@/features/home-display/components/PairDisplayForm';

export default function HomeDisplaySetupScreen() {
  return (
    <AuthLayout
      title="Set up a home display"
      subtitle="Use a spare phone or tablet that stays at the home. Enter the setup code from the family's Welcheq app."
    >
      <PairDisplayForm />
    </AuthLayout>
  );
}
