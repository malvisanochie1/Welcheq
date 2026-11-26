import { View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { SIGN_UP_ROLE_OPTIONS } from '@/config/roles';
import { signOut } from '@/features/auth/api/auth.api';
import { useOwnProfile } from '@/features/auth/hooks/use-own-profile';

export default function HomeScreen() {
  const { data: profile } = useOwnProfile();

  if (!profile) {
    return null;
  }

  const firstName = profile.fullName.split(' ')[0];
  const roleTitle = SIGN_UP_ROLE_OPTIONS.find((option) => option.role === profile.role)?.title;

  return (
    <Screen contentClassName="gap-6">
      <View className="gap-1">
        <Text variant="caption">Welcome, {firstName}</Text>
        <Text variant="title">{roleTitle}</Text>
      </View>
      <Button label="Sign out" variant="secondary" onPress={signOut} />
    </Screen>
  );
}
