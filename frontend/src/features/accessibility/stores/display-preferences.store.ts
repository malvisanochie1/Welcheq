import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ColorMode } from '@/theme';

export type TextSize = 'standard' | 'large' | 'extra-large';

interface DisplayPreferencesState {
  colorMode: ColorMode;
  textSize: TextSize;
  hasReadingAid: boolean;
  setColorMode: (colorMode: ColorMode) => void;
  setTextSize: (textSize: TextSize) => void;
  setReadingAid: (hasReadingAid: boolean) => void;
}

const STORAGE_KEY = 'welcheq.display-preferences';

/** Kept on this device only, so each person can set up their own phone the way they read best. */
export const useDisplayPreferences = create<DisplayPreferencesState>()(
  persist(
    (set) => ({
      colorMode: 'standard',
      textSize: 'standard',
      hasReadingAid: false,
      setColorMode: (colorMode) => set({ colorMode }),
      setTextSize: (textSize) => set({ textSize }),
      setReadingAid: (hasReadingAid) => set({ hasReadingAid }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ colorMode, textSize, hasReadingAid }) => ({
        colorMode,
        textSize,
        hasReadingAid,
      }),
    },
  ),
);
