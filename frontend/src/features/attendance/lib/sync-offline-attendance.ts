import { ApiError } from '@/lib/api-client';
import { attendanceApi } from '../api/attendance.api';
import {
  useOfflineAttendanceStore,
  type PendingAttendance,
} from '../stores/offline-attendance.store';

export const LOCAL_ID_PREFIX = 'local-';

export function createLocalId(): string {
  return `${LOCAL_ID_PREFIX}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface SyncResult {
  synced: number;
  rejected: string[];
}

const isNetworkFailure = (error: unknown) => error instanceof ApiError && error.status === 0;

const currentEntry = (localId: string): PendingAttendance | undefined =>
  useOfflineAttendanceStore.getState().pending.find((entry) => entry.localId === localId);

function dropDependents(checkInLocalId: string) {
  const { pending, remove } = useOfflineAttendanceStore.getState();
  pending
    .filter((entry) => entry.kind === 'check-out' && entry.visitRef === checkInLocalId)
    .forEach((entry) => remove(entry.localId));
}

/**
 * Sends queued records oldest first. The queue is re-read on every step because a synced
 * check-in gives its waiting check-out a real visit id. A network failure stops the run so
 * order is kept; a rejected check-in also drops the check-out that depended on it.
 */
export async function syncOfflineAttendance(): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, rejected: [] };
  const queuedIds = useOfflineAttendanceStore.getState().pending.map((entry) => entry.localId);

  for (const localId of queuedIds) {
    const entry = currentEntry(localId);
    if (!entry) continue;

    const { remove, replaceVisitRef } = useOfflineAttendanceStore.getState();
    try {
      if (entry.kind === 'check-in') {
        const visit = await attendanceApi.checkIn(entry.patientId, entry.event);
        replaceVisitRef(entry.localId, visit.id);
      } else {
        await attendanceApi.checkOut(entry.patientId, entry.visitRef, entry.event);
      }
      remove(entry.localId);
      result.synced += 1;
    } catch (error) {
      if (isNetworkFailure(error)) {
        break;
      }
      remove(entry.localId);
      if (entry.kind === 'check-in') {
        dropDependents(entry.localId);
      }
      result.rejected.push(
        error instanceof ApiError ? error.message : 'A record could not be saved.',
      );
    }
  }

  return result;
}
