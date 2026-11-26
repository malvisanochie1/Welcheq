import { Redirect, type Href } from 'expo-router';

import { useAccessStage, type AccessStage } from '@/features/auth/hooks/use-access-stage';

const ENTRY_ROUTE: Record<AccessStage, Href> = {
  resolving: '/welcome',
  failed: '/welcome',
  'signed-out': '/welcome',
  'needs-profile': '/setup-profile',
  ready: '/home',
};

export default function EntryScreen() {
  const { stage } = useAccessStage();
  return <Redirect href={ENTRY_ROUTE[stage]} />;
}
