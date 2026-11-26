import * as SecureStore from 'expo-secure-store';

import type { HomeDisplayConfig } from '../stores/home-display.store';

const KEY = 'welcheq.home-display';

export const displayStorage = {
  async read(): Promise<HomeDisplayConfig | null> {
    const stored = await SecureStore.getItemAsync(KEY);
    return stored ? (JSON.parse(stored) as HomeDisplayConfig) : null;
  },
  write: (config: HomeDisplayConfig) => SecureStore.setItemAsync(KEY, JSON.stringify(config)),
  clear: () => SecureStore.deleteItemAsync(KEY),
};
