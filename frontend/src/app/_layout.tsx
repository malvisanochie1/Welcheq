import '@/theme/global.css';

import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorState } from '@/components/layout/ErrorState';
import { useAccessStage } from '@/features/auth/hooks/use-access-stage';
import { useSessionStore } from '@/features/auth/stores/session.store';
import { queryClient } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();

const FONTS = { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold };

export default function RootLayout() {
  const [areFontsLoaded] = useFonts(FONTS);
  const initializeSession = useSessionStore((state) => state.initialize);

  useEffect(() => initializeSession(), [initializeSession]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          {areFontsLoaded && <RootNavigator />}
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { stage, errorMessage, retry } = useAccessStage();

  useEffect(() => {
    if (stage !== 'resolving') {
      SplashScreen.hideAsync();
    }
  }, [stage]);

  if (stage === 'resolving') {
    return null;
  }

  if (stage === 'failed') {
    return (
      <ErrorState
        title="We couldn't load your account"
        message={errorMessage ?? 'Please check your connection and try again.'}
        onRetry={retry}
      />
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={stage === 'signed-out'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={stage === 'needs-profile'}>
        <Stack.Screen name="setup-profile" />
      </Stack.Protected>
      <Stack.Protected guard={stage === 'ready'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
