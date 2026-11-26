import { router } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { BRAND } from '@/config/brand';

const PROMISES = [
  'Know the moment your caregiver arrives and leaves.',
  'See what care was given, task by task.',
  "Keep your loved one's health details in one safe place.",
];

export default function WelcomeScreen() {
  return (
    <Screen isScrollable={false} contentClassName="justify-between">
      <View className="gap-3 pt-8">
        <Text variant="label" className="text-primary">
          {BRAND.NAME}
        </Text>
        <Text variant="display">{BRAND.TAGLINE}</Text>
      </View>

      <View className="gap-4">
        {PROMISES.map((promise) => (
          <View key={promise} className="flex-row items-start gap-3">
            <View className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />
            <Text variant="body" className="flex-1 text-ink-muted">
              {promise}
            </Text>
          </View>
        ))}
      </View>

      <View className="gap-3 pb-4">
        <Button label="Get started" onPress={() => router.push('/sign-up')} />
        <Button
          label="I already have an account"
          variant="secondary"
          onPress={() => router.push('/sign-in')}
        />
        <Button
          label="Set up a home display"
          variant="ghost"
          onPress={() => router.push('/home-display-setup')}
        />
      </View>
    </Screen>
  );
}
