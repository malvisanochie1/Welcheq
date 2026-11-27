import { router } from 'expo-router';
import { Platform, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { SIGN_UP_ROLE_OPTIONS } from '@/config/roles';
import { signOut } from '@/features/auth/api/auth.api';
import { useOwnProfile } from '@/features/auth/hooks/use-own-profile';
import { DisplaySettings } from '@/features/accessibility/components/DisplaySettings';
import { BiometricSettings } from '@/features/security/components/BiometricSettings';

export default function SettingsScreen() {
  const { data: profile } = useOwnProfile();
  const roleTitle = SIGN_UP_ROLE_OPTIONS.find((option) => option.role === profile?.role)?.title;

  return (
    <Screen contentClassName="gap-8">
      <Text variant="title">Settings</Text>

      <View className="gap-1 rounded-lg border border-border bg-surface p-4">
        <Text variant="heading">{profile?.fullName}</Text>
        <Text variant="caption">{profile?.email}</Text>
        {roleTitle && <Text variant="caption">{roleTitle}</Text>}
      </View>

      <View className="gap-3">
        <Text variant="label" className="text-ink-muted">
          DISPLAY
        </Text>
        <View className="rounded-lg border border-border bg-surface p-4">
          <DisplaySettings />
        </View>
      </View>

      {Platform.OS !== 'web' && (
        <View className="gap-3">
          <Text variant="label" className="text-ink-muted">
            SECURITY
          </Text>
          <View className="rounded-lg border border-border bg-surface p-4">
            <BiometricSettings />
          </View>
        </View>
      )}

      <View className="gap-2">
        <Button label="Sign out" variant="secondary" onPress={signOut} />
        <Button label="Privacy policy" variant="ghost" onPress={() => router.push('/privacy')} />
        <Button
          label="Delete my account"
          variant="ghost"
          onPress={() => router.push('/delete-account')}
        />
      </View>
    </Screen>
  );
}
