import { Stack } from 'expo-router';
import { View } from 'react-native';

import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { useIsWideLayout } from '@/hooks/use-is-wide-layout';

export default function AppStackLayout() {
  const isWide = useIsWideLayout();
  const stack = (
    <Stack screenOptions={{ headerShown: false, animation: isWide ? 'none' : 'default' }} />
  );

  if (!isWide) {
    return stack;
  }

  return (
    <View className="flex-1 flex-row bg-canvas">
      <DesktopSidebar />
      <View className="flex-1">{stack}</View>
    </View>
  );
}
