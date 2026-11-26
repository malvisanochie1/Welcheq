import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => {
  const memory = new Map<string, string>();
  return {
    default: {
      getItem: async (key: string) => memory.get(key) ?? null,
      setItem: async (key: string, value: string) => void memory.set(key, value),
      removeItem: async (key: string) => void memory.delete(key),
    },
  };
});

vi.mock('@/lib/api-client', () => ({
  ApiError: class ApiError extends Error {
    constructor(
      readonly status: number,
      readonly code: string,
      message: string,
    ) {
      super(message);
    }
  },
}));

vi.mock('../api/attendance.api', () => ({
  attendanceApi: { checkIn: vi.fn(), checkOut: vi.fn() },
}));

const { ApiError } = await import('@/lib/api-client');
const { attendanceApi } = await import('../api/attendance.api');
const { useOfflineAttendanceStore } = await import('../stores/offline-attendance.store');
const { syncOfflineAttendance } = await import('./sync-offline-attendance');

const event = {
  location: { latitude: 6.44, longitude: 7.5, accuracyMeters: 10 },
  capturedAt: '2026-11-26T08:00:00Z',
  isOffline: true,
};

function queueOfflineVisit() {
  const { enqueue } = useOfflineAttendanceStore.getState();
  enqueue({ kind: 'check-in', localId: 'local-in', patientId: 'patient-1', event });
  enqueue({
    kind: 'check-out',
    localId: 'local-out',
    patientId: 'patient-1',
    visitRef: 'local-in',
    event,
  });
}

beforeEach(() => {
  vi.mocked(attendanceApi.checkIn).mockReset();
  vi.mocked(attendanceApi.checkOut).mockReset();
  useOfflineAttendanceStore.getState().clear();
});

describe('syncOfflineAttendance', () => {
  it('syncs a check-in, then its check-out with the real visit id', async () => {
    vi.mocked(attendanceApi.checkIn).mockResolvedValue({ id: 'visit-9' } as never);
    vi.mocked(attendanceApi.checkOut).mockResolvedValue({ id: 'visit-9' } as never);
    queueOfflineVisit();

    const result = await syncOfflineAttendance();

    expect(result).toEqual({ synced: 2, rejected: [] });
    expect(attendanceApi.checkOut).toHaveBeenCalledWith('patient-1', 'visit-9', event);
    expect(useOfflineAttendanceStore.getState().pending).toEqual([]);
  });

  it('keeps everything queued while still offline', async () => {
    vi.mocked(attendanceApi.checkIn).mockRejectedValue(new ApiError(0, 'NETWORK', 'offline'));
    queueOfflineVisit();

    const result = await syncOfflineAttendance();

    expect(result.synced).toBe(0);
    expect(useOfflineAttendanceStore.getState().pending).toHaveLength(2);
    expect(attendanceApi.checkOut).not.toHaveBeenCalled();
  });

  it('drops a rejected check-in together with the check-out that depended on it', async () => {
    vi.mocked(attendanceApi.checkIn).mockRejectedValue(
      new ApiError(400, 'VALIDATION_FAILED', 'You are about 900 m from the home.'),
    );
    queueOfflineVisit();

    const result = await syncOfflineAttendance();

    expect(result.rejected).toEqual(['You are about 900 m from the home.']);
    expect(useOfflineAttendanceStore.getState().pending).toEqual([]);
    expect(attendanceApi.checkOut).not.toHaveBeenCalled();
  });
});
