import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { signOut } from '@/features/auth/api/auth.api';
import { useOwnProfile } from '@/features/auth/hooks/use-own-profile';

export function DemoBanner() {
  const { data: profile } = useOwnProfile();
  if (!profile?.isDemo) return null;

  return (
    <View className="flex-row items-center gap-3 bg-accent-soft px-4 py-2">
      <Text variant="caption" className="flex-1 text-ink">
        You're exploring a demo with made-up data. Changes are switched off.
      </Text>
      <Button label="Leave demo" variant="ghost" onPress={signOut} />
    </View>
  );
}
