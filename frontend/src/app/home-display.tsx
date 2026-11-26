import { HomeCodeDisplay } from '@/features/home-display/components/HomeCodeDisplay';
import { useHomeDisplayStore } from '@/features/home-display/stores/home-display.store';

export default function HomeDisplayScreen() {
  const config = useHomeDisplayStore((state) => state.config);
  const unpair = useHomeDisplayStore((state) => state.unpair);

  return config ? <HomeCodeDisplay config={config} onStop={unpair} /> : null;
}
