import { router } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

export default function NotFoundScreen() {
  return (
    <Screen isScrollable={false} contentClassName="justify-center gap-6">
      <View className="gap-2">
        <Text variant="title">This page doesn't exist</Text>
        <Text variant="body" className="text-ink-muted">
          The link may be old or mistyped.
        </Text>
      </View>
      <Button label="Go to Welcheq" onPress={() => router.replace('/')} />
    </Screen>
  );
}
