import { Redirect, type Href } from 'expo-router';

import { useAccessStage, type AccessStage } from '@/features/auth/hooks/use-access-stage';
import { useHomeDisplayStore } from '@/features/home-display/stores/home-display.store';

const ENTRY_ROUTE: Record<AccessStage, Href> = {
  resolving: '/welcome',
  failed: '/welcome',
  'signed-out': '/welcome',
  'needs-profile': '/setup-profile',
  ready: '/home',
};

export default function EntryScreen() {
  const { stage } = useAccessStage();
  const isHomeDisplay = useHomeDisplayStore((state) => state.status === 'paired');
  return <Redirect href={isHomeDisplay ? '/home-display' : ENTRY_ROUTE[stage]} />;
}
