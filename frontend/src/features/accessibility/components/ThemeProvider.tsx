import { StatusBar } from 'expo-status-bar';
import { vars } from 'nativewind';
import { useMemo, type ReactNode } from 'react';
import { View } from 'react-native';

import { usePalette } from '../hooks/use-palette';
import { useDisplayPreferences } from '../stores/display-preferences.store';

/** Publishes the chosen palette as CSS variables, which every Tailwind colour class reads. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const palette = usePalette();
  const isNight = useDisplayPreferences((state) => state.colorMode === 'night');
  const themeVariables = useMemo(
    () =>
      vars(
        Object.fromEntries(
          Object.entries(palette).map(([name, value]) => [`--color-${name}`, value]),
        ),
      ),
    [palette],
  );

  return (
    <View style={[{ flex: 1 }, themeVariables]}>
      <StatusBar style={isNight ? 'light' : 'dark'} />
      {children}
    </View>
  );
}
