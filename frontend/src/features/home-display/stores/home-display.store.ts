import { create } from 'zustand';

import { displayStorage } from '../lib/display-storage';

export interface HomeDisplayConfig {
  patientFirstName: string;
  secret: string;
}

interface HomeDisplayState {
  status: 'loading' | 'unpaired' | 'paired';
  config: HomeDisplayConfig | null;
  load: () => Promise<void>;
  pair: (config: HomeDisplayConfig) => Promise<void>;
  unpair: () => Promise<void>;
}

export const useHomeDisplayStore = create<HomeDisplayState>((set) => ({
  status: 'loading',
  config: null,

  load: async () => {
    const config = await displayStorage.read().catch(() => null);
    set({ config, status: config ? 'paired' : 'unpaired' });
  },

  pair: async (config) => {
    await displayStorage.write(config);
    set({ config, status: 'paired' });
  },

  unpair: async () => {
    await displayStorage.clear();
    set({ config: null, status: 'unpaired' });
  },
}));
