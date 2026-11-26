import type { AttendanceEventInput, CreateShiftInput } from '@welcheq/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { attendanceApi, type DateRange } from '../api/attendance.api';

export const ATTENDANCE_KEY = ['attendance'] as const;
const patientShiftsKey = (patientId: string, range: DateRange) =>
  [...ATTENDANCE_KEY, 'patient', patientId, range.from, range.to] as const;
const myShiftsKey = (range: DateRange) =>
  [...ATTENDANCE_KEY, 'mine', range.from, range.to] as const;
const openVisitKey = [...ATTENDANCE_KEY, 'open-visit'] as const;

const LIVE_REFRESH_MS = 60_000;

function useRefreshAttendance() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEY });
}

export function usePatientShifts(patientId: string, range: DateRange) {
  return useQuery({
    queryKey: patientShiftsKey(patientId, range),
    queryFn: () => attendanceApi.patientShifts(patientId, range),
    refetchInterval: LIVE_REFRESH_MS,
  });
}

export function usePatientVisits(patientId: string, range: DateRange) {
  return useQuery({
    queryKey: [...ATTENDANCE_KEY, 'visits', patientId, range.from, range.to],
    queryFn: () => attendanceApi.patientVisits(patientId, range),
  });
}

export function useMyShifts(range: DateRange, isEnabled = true) {
  return useQuery({
    queryKey: myShiftsKey(range),
    queryFn: () => attendanceApi.myShifts(range),
    enabled: isEnabled,
    refetchInterval: LIVE_REFRESH_MS,
  });
}

export function useMyOpenVisit(isEnabled = true) {
  return useQuery({
    queryKey: openVisitKey,
    queryFn: attendanceApi.myOpenVisit,
    enabled: isEnabled,
  });
}

export function useScheduleShifts(patientId: string) {
  const refresh = useRefreshAttendance();
  return useMutation({
    mutationFn: (input: CreateShiftInput) => attendanceApi.scheduleShifts(patientId, input),
    onSuccess: refresh,
  });
}

export function useCancelShift(patientId: string) {
  const refresh = useRefreshAttendance();
  return useMutation({
    mutationFn: (shiftId: string) => attendanceApi.cancelShift(patientId, shiftId),
    onSuccess: refresh,
  });
}

export function useCheckIn(patientId: string) {
  const refresh = useRefreshAttendance();
  return useMutation({
    mutationFn: (event: AttendanceEventInput) => attendanceApi.checkIn(patientId, event),
    onSuccess: refresh,
  });
}

export function useCheckOut(patientId: string) {
  const refresh = useRefreshAttendance();
  return useMutation({
    mutationFn: ({ visitId, event }: { visitId: string; event: AttendanceEventInput }) =>
      attendanceApi.checkOut(patientId, visitId, event),
    onSuccess: refresh,
  });
}
