import type {
  AttendanceEventInput,
  AttendanceFlag,
  CreateShiftInput,
  ShiftStatus,
  SurpriseCheckResponseInput,
  SurpriseCheckStatus,
} from '@welcheq/shared';

import { apiRequest } from '@/lib/api-client';

export interface Visit {
  id: string;
  patientId: string;
  shiftId: string | null;
  caregiver: { id: string; fullName: string };
  checkInAt: string;
  checkOutAt: string | null;
  checkInDistanceMeters: number;
  checkOutDistanceMeters: number | null;
  flags: AttendanceFlag[];
  isOpen: boolean;
  homeCodeVerified: boolean;
  hasSelfie: boolean;
  surpriseCheck: {
    id: string | null;
    status: SurpriseCheckStatus;
    dueAt: string | null;
    respondedAt: string | null;
  } | null;
}

export interface Shift {
  id: string;
  patientId: string;
  patientName: string;
  seriesId: string | null;
  caregiver: { id: string; fullName: string };
  startsAt: string;
  endsAt: string;
  status: ShiftStatus;
  isLate: boolean;
  isEarlyDeparture: boolean;
  visit: Visit | null;
}

export interface DateRange {
  from: string;
  to: string;
}

const patientPath = (patientId: string) => `/v1/patients/${encodeURIComponent(patientId)}`;
const rangeQuery = ({ from, to }: DateRange) =>
  `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

export const attendanceApi = {
  patientShifts: (patientId: string, range: DateRange) =>
    apiRequest<Shift[]>(`${patientPath(patientId)}/shifts${rangeQuery(range)}`),
  scheduleShifts: (patientId: string, input: CreateShiftInput) =>
    apiRequest<Shift[]>(`${patientPath(patientId)}/shifts`, { method: 'POST', body: input }),
  cancelShift: (patientId: string, shiftId: string) =>
    apiRequest<void>(`${patientPath(patientId)}/shifts/${encodeURIComponent(shiftId)}`, {
      method: 'DELETE',
    }),
  checkIn: (patientId: string, event: AttendanceEventInput) =>
    apiRequest<Visit>(`${patientPath(patientId)}/visits/check-in`, { method: 'POST', body: event }),
  checkOut: (patientId: string, visitId: string, event: AttendanceEventInput) =>
    apiRequest<Visit>(`${patientPath(patientId)}/visits/${encodeURIComponent(visitId)}/check-out`, {
      method: 'POST',
      body: event,
    }),
  patientVisits: (patientId: string, range: DateRange) =>
    apiRequest<Visit[]>(`${patientPath(patientId)}/visits${rangeQuery(range)}`),
  answerSurpriseCheck: (patientId: string, visitId: string, input: SurpriseCheckResponseInput) =>
    apiRequest<{ passed: boolean }>(
      `${patientPath(patientId)}/visits/${encodeURIComponent(visitId)}/surprise-check`,
      { method: 'POST', body: input },
    ),
  requestSelfieUpload: (patientId: string) =>
    apiRequest<{ path: string; uploadUrl: string }>(
      `${patientPath(patientId)}/visits/selfie-upload`,
      {
        method: 'POST',
      },
    ),
  viewSelfie: (patientId: string, visitId: string) =>
    apiRequest<{ url: string; expiresAt: string }>(
      `${patientPath(patientId)}/visits/${encodeURIComponent(visitId)}/selfie`,
    ),
  myShifts: (range: DateRange) => apiRequest<Shift[]>(`/v1/me/shifts${rangeQuery(range)}`),
  myOpenVisit: () => apiRequest<Visit | null>('/v1/me/visits/open'),
};
