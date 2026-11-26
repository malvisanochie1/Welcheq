import { randomUUID } from 'node:crypto';

import {
  addDays,
  parseClockTime,
  PATIENT_EDITOR_RELATIONSHIPS,
  shiftDurationMinutes,
  shiftsOverlap,
  zonedDateTimeToInstant,
  type createShiftSchema,
  type ShiftTiming,
} from '@welcheq/shared';
import type { z } from 'zod';

import { AUDIT_ACTION, recordAuditEvent } from '@/lib/audit';
import { HttpError } from '@/lib/http-error';
import { prisma } from '@/lib/prisma';
import type { ActingUser } from '@/middleware/require-profile';
import { requirePatientAccess } from '@/modules/patients/patient-access';
import { toShiftResponse } from './attendance.mapper';
import { attendanceRepository, type TimeRange } from './attendance.repository';

type CreateShiftData = z.output<typeof createShiftSchema>;

const MINUTE_MS = 60_000;
const DAYS_PER_WEEK = 7;

export function localRange(from: string, to: string, timeZone: string): TimeRange {
  return {
    start: zonedDateTimeToInstant(from, 0, timeZone),
    end: zonedDateTimeToInstant(addDays(to, 1), 0, timeZone),
  };
}

function buildOccurrences(input: CreateShiftData, timeZone: string): ShiftTiming[] {
  const startMinutes = parseClockTime(input.startTime);
  const duration = shiftDurationMinutes(input.startTime, input.endTime);
  if (startMinutes === null || duration === null) {
    throw HttpError.invalid('Check the start and end times');
  }

  return Array.from({ length: input.repeatWeeks + 1 }, (_, week) => {
    const startsAt = zonedDateTimeToInstant(
      addDays(input.date, week * DAYS_PER_WEEK),
      startMinutes,
      timeZone,
    );
    return {
      startsAt,
      endsAt: new Date(startsAt.getTime() + duration * MINUTE_MS),
      cancelledAt: null,
    };
  });
}

export const scheduleService = {
  async schedule(user: ActingUser, patientId: string, input: CreateShiftData) {
    await requirePatientAccess(user, patientId, PATIENT_EDITOR_RELATIONSHIPS);

    const caregiver = await attendanceRepository.findActiveCaregiver(patientId, input.caregiverId);
    if (!caregiver) {
      throw HttpError.invalid('Choose a caregiver from this care team');
    }

    const { timeZone } = await attendanceRepository.patientSettings(patientId);
    const occurrences = buildOccurrences(input, timeZone);
    const first = occurrences[0];
    const last = occurrences.at(-1);
    if (!first || !last || first.endsAt <= new Date()) {
      throw HttpError.invalid('This visit has already ended. Choose a later time.');
    }

    const seriesId = occurrences.length > 1 ? randomUUID() : null;

    await prisma.$transaction(async (tx) => {
      const existing = await attendanceRepository.findCaregiverShiftsBetween(
        tx,
        input.caregiverId,
        {
          start: first.startsAt,
          end: last.endsAt,
        },
      );
      const clash = occurrences.some((occurrence) =>
        existing.some((shift) => shiftsOverlap(occurrence, shift)),
      );
      if (clash) {
        throw HttpError.conflict(`${caregiver.user.fullName} already has a visit at that time.`);
      }

      await attendanceRepository.createShifts(
        tx,
        occurrences.map((occurrence) => ({
          patientId,
          caregiverId: input.caregiverId,
          seriesId,
          startsAt: occurrence.startsAt,
          endsAt: occurrence.endsAt,
          createdById: user.id,
        })),
      );
      await recordAuditEvent(tx, {
        actorId: user.id,
        action: AUDIT_ACTION.SHIFTS_SCHEDULED,
        entityType: 'patient',
        entityId: patientId,
        metadata: { caregiverId: input.caregiverId, count: occurrences.length, seriesId },
      });
    });

    return this.listForPatient(user, patientId, input.date, input.date);
  },

  async listForPatient(user: ActingUser, patientId: string, from: string, to: string) {
    await requirePatientAccess(user, patientId);
    const { timeZone } = await attendanceRepository.patientSettings(patientId);
    const shifts = await attendanceRepository.listPatientShifts(
      patientId,
      localRange(from, to, timeZone),
    );
    const now = new Date();
    return shifts.map((shift) => toShiftResponse(shift, now));
  },

  async listMine(user: ActingUser, range: TimeRange) {
    const shifts = await attendanceRepository.listCaregiverShifts(user.id, range);
    const now = new Date();
    return shifts.map((shift) => toShiftResponse(shift, now));
  },

  async cancel(user: ActingUser, patientId: string, shiftId: string) {
    await requirePatientAccess(user, patientId, PATIENT_EDITOR_RELATIONSHIPS);
    if (!(await attendanceRepository.findShift(patientId, shiftId))) {
      throw HttpError.notFound('Visit not found');
    }

    await prisma.$transaction(async (tx) => {
      const { count } = await attendanceRepository.cancelShift(tx, shiftId, new Date());
      if (count === 0) {
        throw HttpError.conflict('This visit has already started or was cancelled.');
      }
      await recordAuditEvent(tx, {
        actorId: user.id,
        action: AUDIT_ACTION.SHIFT_CANCELLED,
        entityType: 'patient',
        entityId: patientId,
        metadata: { shiftId },
      });
    });
  },
};
