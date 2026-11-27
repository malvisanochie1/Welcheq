import '@/theme/global.css';

import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorState } from '@/components/layout/ErrorState';
import { ThemeProvider } from '@/features/accessibility/components/ThemeProvider';
import { useAccessStage } from '@/features/auth/hooks/use-access-stage';
import { useOwnProfile } from '@/features/auth/hooks/use-own-profile';
import { useHomeDisplayStore } from '@/features/home-display/stores/home-display.store';
import { LockScreen } from '@/features/security/components/LockScreen';
import { useInactivityLock } from '@/features/security/hooks/use-inactivity-lock';
import { useAppLockStore } from '@/features/security/stores/app-lock.store';
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
          <ThemeProvider>{areFontsLoaded && <RootNavigator />}</ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { stage, errorMessage, retry } = useAccessStage();
  const { data: profile } = useOwnProfile();
  const displayStatus = useHomeDisplayStore((state) => state.status);
  const loadDisplay = useHomeDisplayStore((state) => state.load);
  const isHomeDisplay = displayStatus === 'paired';
  const isResolving = stage === 'resolving' || displayStatus === 'loading';

  useEffect(() => {
    loadDisplay();
  }, [loadDisplay]);
  const isSignedIn = stage === 'ready' || stage === 'needs-profile';
  const isLocked = useAppLockStore((state) => state.isLocked);

  useInactivityLock(isSignedIn);

  useEffect(() => {
    if (!isResolving) {
      SplashScreen.hideAsync();
    }
  }, [isResolving]);

  if (isResolving) {
    return null;
  }

  if (stage === 'failed' && !isHomeDisplay) {
    return (
      <ErrorState
        title="We couldn't load your account"
        message={errorMessage ?? 'Please check your connection and try again.'}
        onRetry={retry}
      />
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="email-confirmed" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="privacy" />
        <Stack.Protected guard={isHomeDisplay}>
          <Stack.Screen name="home-display" />
        </Stack.Protected>
        <Stack.Protected guard={!isHomeDisplay && stage === 'signed-out'}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={!isHomeDisplay && stage === 'needs-profile'}>
          <Stack.Screen name="setup-profile" />
        </Stack.Protected>
        <Stack.Protected guard={!isHomeDisplay && stage === 'ready'}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Screen name="+not-found" />
      </Stack>
      {isSignedIn && isLocked && !isHomeDisplay && (
        <LockScreen firstName={profile?.fullName.split(' ')[0]} />
      )}
    </>
  );
}
