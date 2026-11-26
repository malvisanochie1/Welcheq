import { SESSION } from '@welcheq/shared';
import { create } from 'zustand';

const LOCK_AFTER_MS = SESSION.INACTIVITY_LOCK_MINUTES * 60_000;

interface AppLockState {
  isLocked: boolean;
  backgroundedAt: number | null;
  markBackgrounded: () => void;
  markForegrounded: () => void;
  unlock: () => void;
  reset: () => void;
}

export const useAppLockStore = create<AppLockState>((set, get) => ({
  isLocked: false,
  backgroundedAt: null,

  markBackgrounded: () => set({ backgroundedAt: Date.now() }),

  markForegrounded: () => {
    const { backgroundedAt } = get();
    const hasBeenAwayTooLong =
      backgroundedAt !== null && Date.now() - backgroundedAt >= LOCK_AFTER_MS;
    set({ backgroundedAt: null, isLocked: get().isLocked || hasBeenAwayTooLong });
  },

  unlock: () => set({ isLocked: false }),

  reset: () => set({ isLocked: false, backgroundedAt: null }),
}));
