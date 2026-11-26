import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAppLockStore } from '../stores/app-lock.store';

export function useInactivityLock(isActive: boolean) {
  const markBackgrounded = useAppLockStore((state) => state.markBackgrounded);
  const markForegrounded = useAppLockStore((state) => state.markForegrounded);
  const reset = useAppLockStore((state) => state.reset);

  useEffect(() => {
    if (!isActive) {
      reset();
      return undefined;
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        markForegrounded();
      } else if (nextState === 'background') {
        markBackgrounded();
      }
    });

    return () => subscription.remove();
  }, [isActive, markBackgrounded, markForegrounded, reset]);
}
