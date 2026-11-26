import type { HomeDisplayConfig } from '../stores/home-display.store';

const KEY = 'welcheq.home-display';

/** A browser used as a home display must survive restarts, so it keeps its pairing locally. */
export const displayStorage = {
  async read(): Promise<HomeDisplayConfig | null> {
    const stored = globalThis.localStorage?.getItem(KEY);
    return stored ? (JSON.parse(stored) as HomeDisplayConfig) : null;
  },
  async write(config: HomeDisplayConfig) {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(config));
  },
  async clear() {
    globalThis.localStorage?.removeItem(KEY);
  },
};
