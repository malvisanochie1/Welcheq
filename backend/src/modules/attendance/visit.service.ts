import {
  ATTENDANCE_FLAG,
  ATTENDANCE_RULES,
  CARE_RELATIONSHIP,
  distanceInMeters,
  GEOFENCE,
  isEarlyDeparture,
  isLateArrival,
  isWithinCheckInWindow,
  isWithinGeofence,
  OFFLINE_SYNC,
  type AttendanceFlag,
  type attendanceEventSchema,
} from '@welcheq/shared';
import type { z } from 'zod';

import { Prisma } from '@/generated/prisma/client';
import { AUDIT_ACTION, recordAuditEvent } from '@/lib/audit';
import { HttpError } from '@/lib/http-error';
import { prisma } from '@/lib/prisma';
import type { ActingUser } from '@/middleware/require-profile';
import { requirePatientAccess } from '@/modules/patients/patient-access';
import { toVisitResponse } from './attendance.mapper';
import { attendanceRepository } from './attendance.repository';
import { localRange } from './schedule.service';

type AttendanceEvent = z.output<typeof attendanceEventSchema>;

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const UNIQUE_VIOLATION = 'P2002';
const CAREGIVER_ONLY = [CARE_RELATIONSHIP.CAREGIVER] as const;

/**
 * The server clock decides when things happened. A client time is only trusted for events
 * recorded offline, and then only within a bounded window that cannot be in the future.
 */
function resolveEventTime(event: AttendanceEvent, now: Date): Date {
  if (!event.isOffline) {
    return now;
  }

  const capturedAt = new Date(event.capturedAt);
  const latestAllowed = now.getTime() + OFFLINE_SYNC.MAX_CLOCK_SKEW_SECONDS * 1000;
  const earliestAllowed = now.getTime() - OFFLINE_SYNC.MAX_OFFLINE_AGE_HOURS * HOUR_MS;
  if (capturedAt.getTime() > latestAllowed || capturedAt.getTime() < earliestAllowed) {
    throw HttpError.invalid(
      "This offline record's time could not be confirmed. Check your phone's date and time.",
    );
  }
  return new Date(Math.min(capturedAt.getTime(), now.getTime()));
}

function measure(event: AttendanceEvent, home: { latitude: number; longitude: number }) {
  const { latitude, longitude, accuracyMeters } = event.location;
  return {
    distanceMeters: distanceInMeters({ latitude, longitude }, home),
    reading: { latitude, longitude, accuracyMeters },
  };
}

export const visitService = {
  async checkIn(user: ActingUser, patientId: string, event: AttendanceEvent) {
    await requirePatientAccess(user, patientId, CAREGIVER_ONLY);

    if (event.location.accuracyMeters > GEOFENCE.MAX_ACCEPTED_ACCURACY_METERS) {
      throw HttpError.invalid(
        'Your location is not precise enough yet. Move near a window or outside and try again.',
      );
    }

    const patient = await attendanceRepository.patientSettings(patientId);
    const home = { latitude: patient.homeLatitude, longitude: patient.homeLongitude };
    const { distanceMeters, reading } = measure(event, home);

    if (!isWithinGeofence(event.location, home, patient.geofenceRadiusMeters)) {
      throw HttpError.invalid(
        `You are about ${Math.round(distanceMeters)} m from the home. Check in when you arrive.`,
      );
    }

    const now = new Date();
    const checkInAt = resolveEventTime(event, now);
    const flags: AttendanceFlag[] = [];
    if (event.location.isMocked) flags.push(ATTENDANCE_FLAG.MOCK_LOCATION);
    if (event.isOffline) flags.push(ATTENDANCE_FLAG.RECORDED_OFFLINE);

    const candidates = await attendanceRepository.findAttachableShifts(
      user.id,
      patientId,
      checkInAt,
      ATTENDANCE_RULES.EARLY_CHECK_IN_MINUTES * MINUTE_MS,
    );
    const shift = candidates.find((candidate) => isWithinCheckInWindow(candidate, checkInAt));
    if (shift && isLateArrival(shift, { checkInAt, checkOutAt: null })) {
      flags.push(ATTENDANCE_FLAG.LATE_ARRIVAL);
    }

    try {
      const visit = await prisma.$transaction(async (tx) => {
        const created = await attendanceRepository.createVisit(tx, {
          patientId,
          caregiverId: user.id,
          openForCaregiverId: user.id,
          shiftId: shift?.id ?? null,
          checkInAt,
          checkInClientAt: new Date(event.capturedAt),
          checkInLatitude: reading.latitude,
          checkInLongitude: reading.longitude,
          checkInAccuracyMeters: reading.accuracyMeters,
          checkInDistanceMeters: distanceMeters,
          flags,
        });
        await recordAuditEvent(tx, {
          actorId: user.id,
          action: AUDIT_ACTION.VISIT_CHECKED_IN,
          entityType: 'visit',
          entityId: created.id,
          metadata: { patientId, flags },
        });
        return created;
      });
      return toVisitResponse(visit);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_VIOLATION
      ) {
        throw HttpError.conflict('You are already checked in. Check out of that visit first.');
      }
      throw error;
    }
  },

  async checkOut(user: ActingUser, patientId: string, visitId: string, event: AttendanceEvent) {
    await requirePatientAccess(user, patientId, CAREGIVER_ONLY);

    const visit = await attendanceRepository.findOpenVisit(user.id);
    if (!visit || visit.id !== visitId || visit.patientId !== patientId) {
      throw HttpError.notFound('There is no open visit to check out of');
    }

    const patient = await attendanceRepository.patientSettings(patientId);
    const home = { latitude: patient.homeLatitude, longitude: patient.homeLongitude };
    const { distanceMeters, reading } = measure(event, home);
    const checkOutAt = resolveEventTime(event, new Date());
    if (checkOutAt < visit.checkInAt) {
      throw HttpError.invalid('Check-out cannot be before check-in.');
    }

    const flags = new Set<AttendanceFlag>(visit.flags);
    if (event.location.isMocked) flags.add(ATTENDANCE_FLAG.MOCK_LOCATION);
    if (event.isOffline) flags.add(ATTENDANCE_FLAG.RECORDED_OFFLINE);
    if (!isWithinGeofence(event.location, home, patient.geofenceRadiusMeters)) {
      flags.add(ATTENDANCE_FLAG.CHECKED_OUT_AWAY);
    }
    if (visit.shift && isEarlyDeparture(visit.shift, { checkInAt: visit.checkInAt, checkOutAt })) {
      flags.add(ATTENDANCE_FLAG.EARLY_DEPARTURE);
    }

    const closed = await prisma.$transaction(async (tx) => {
      const updated = await attendanceRepository.closeVisit(tx, visit.id, {
        openFor: { disconnect: true },
        checkOutAt,
        checkOutClientAt: new Date(event.capturedAt),
        checkOutLatitude: reading.latitude,
        checkOutLongitude: reading.longitude,
        checkOutAccuracyMeters: reading.accuracyMeters,
        checkOutDistanceMeters: distanceMeters,
        flags: [...flags],
      });
      await recordAuditEvent(tx, {
        actorId: user.id,
        action: AUDIT_ACTION.VISIT_CHECKED_OUT,
        entityType: 'visit',
        entityId: visit.id,
        metadata: { patientId, flags: [...flags] },
      });
      return updated;
    });

    return toVisitResponse(closed);
  },

  async openVisit(user: ActingUser) {
    const visit = await attendanceRepository.findOpenVisit(user.id);
    return visit ? toVisitResponse(visit) : null;
  },

  async listForPatient(user: ActingUser, patientId: string, from: string, to: string) {
    await requirePatientAccess(user, patientId);
    const { timeZone } = await attendanceRepository.patientSettings(patientId);
    const visits = await attendanceRepository.listPatientVisits(
      patientId,
      localRange(from, to, timeZone),
    );
    return visits.map(toVisitResponse);
  },
};
