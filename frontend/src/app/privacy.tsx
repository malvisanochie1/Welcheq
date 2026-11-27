import { router } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { BRAND } from '@/config/brand';
import { PRIVACY_POLICY } from '@/config/privacy-policy';

export default function PrivacyPolicyScreen() {
  return (
    <Screen contentClassName="gap-6">
      <ScreenHeader
        canGoBack={router.canGoBack()}
        title="Privacy policy"
        subtitle={`${BRAND.NAME} · updated ${BRAND.PRIVACY_UPDATED}`}
      />
      {PRIVACY_POLICY.map((section) => (
        <View key={section.heading} className="gap-2">
          <Text variant="heading">{section.heading}</Text>
          {section.paragraphs.map((paragraph) => (
            <Text key={paragraph} variant="body" className="text-ink-muted">
              {paragraph}
            </Text>
          ))}
        </View>
      ))}
    </Screen>
  );
}
