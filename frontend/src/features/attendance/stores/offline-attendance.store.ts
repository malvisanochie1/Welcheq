import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AttendanceEventInput } from '@welcheq/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface PendingCheckIn {
  kind: 'check-in';
  localId: string;
  patientId: string;
  event: AttendanceEventInput;
}

export interface PendingCheckOut {
  kind: 'check-out';
  localId: string;
  patientId: string;
  /** Either a real visit id, or the local id of a check-in still waiting to sync. */
  visitRef: string;
  event: AttendanceEventInput;
}

export type PendingAttendance = PendingCheckIn | PendingCheckOut;

interface OfflineAttendanceState {
  pending: PendingAttendance[];
  enqueue: (entry: PendingAttendance) => void;
  remove: (localId: string) => void;
  replaceVisitRef: (localId: string, visitId: string) => void;
  clear: () => void;
}

export const useOfflineAttendanceStore = create<OfflineAttendanceState>()(
  persist(
    (set) => ({
      pending: [],
      enqueue: (entry) => set((state) => ({ pending: [...state.pending, entry] })),
      remove: (localId) =>
        set((state) => ({ pending: state.pending.filter((entry) => entry.localId !== localId) })),
      replaceVisitRef: (localId, visitId) =>
        set((state) => ({
          pending: state.pending.map((entry) =>
            entry.kind === 'check-out' && entry.visitRef === localId
              ? { ...entry, visitRef: visitId }
              : entry,
          ),
        })),
      clear: () => set({ pending: [] }),
    }),
    {
      name: 'welcheq.offline-attendance',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
