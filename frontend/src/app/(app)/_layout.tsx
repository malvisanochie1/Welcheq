import { Stack } from 'expo-router';
import { View } from 'react-native';

import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { OfflineSyncBanner } from '@/features/attendance/components/OfflineSyncBanner';
import { useIsWideLayout } from '@/hooks/use-is-wide-layout';

export default function AppStackLayout() {
  const isWide = useIsWideLayout();
  const stack = (
    <Stack screenOptions={{ headerShown: false, animation: isWide ? 'none' : 'default' }} />
  );

  if (!isWide) {
    return (
      <View className="flex-1 bg-canvas">
        <OfflineSyncBanner />
        {stack}
      </View>
    );
  }

  return (
    <View className="flex-1 flex-row bg-canvas">
      <DesktopSidebar />
      <View className="flex-1">
        <OfflineSyncBanner />
        {stack}
      </View>
    </View>
  );
}
