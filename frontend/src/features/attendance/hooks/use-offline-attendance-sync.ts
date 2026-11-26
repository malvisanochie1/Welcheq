import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { syncOfflineAttendance } from '../lib/sync-offline-attendance';
import { ATTENDANCE_KEY } from './use-attendance';
import { useOfflineAttendanceStore } from '../stores/offline-attendance.store';

const RETRY_INTERVAL_MS = 60_000;

/** Retries queued offline records on start, when the app returns, and every minute. */
export function useOfflineAttendanceSync() {
  const queryClient = useQueryClient();
  const pendingCount = useOfflineAttendanceStore((state) => state.pending.length);
  const [rejections, setRejections] = useState<string[]>([]);

  const sync = useCallback(async () => {
    if (useOfflineAttendanceStore.getState().pending.length === 0) return;
    const result = await syncOfflineAttendance();
    if (result.rejected.length > 0) setRejections(result.rejected);
    if (result.synced > 0 || result.rejected.length > 0) {
      await queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEY });
    }
  }, [queryClient]);

  useEffect(() => {
    sync();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    const interval = setInterval(sync, RETRY_INTERVAL_MS);
    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [sync]);

  return { pendingCount, rejections, dismissRejections: () => setRejections([]), sync };
}
