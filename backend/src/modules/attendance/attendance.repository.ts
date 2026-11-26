import { CARE_RELATIONSHIP } from '@welcheq/shared';

import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { SHIFT_FIELDS, VISIT_FIELDS } from './attendance.mapper';

export interface TimeRange {
  start: Date;
  end: Date;
}

const activeShifts = { cancelledAt: null } as const;

export const attendanceRepository = {
  patientSettings(patientId: string) {
    return prisma.patient.findUniqueOrThrow({
      where: { id: patientId },
      select: {
        timeZone: true,
        homeLatitude: true,
        homeLongitude: true,
        geofenceRadiusMeters: true,
      },
    });
  },

  findActiveCaregiver(patientId: string, caregiverId: string) {
    return prisma.patientAccess.findFirst({
      where: {
        patientId,
        userId: caregiverId,
        relationship: CARE_RELATIONSHIP.CAREGIVER,
        revokedAt: null,
      },
      select: { user: { select: { fullName: true } } },
    });
  },

  findCaregiverShiftsBetween(db: Prisma.TransactionClient, caregiverId: string, range: TimeRange) {
    return db.shift.findMany({
      where: {
        ...activeShifts,
        caregiverId,
        startsAt: { lt: range.end },
        endsAt: { gt: range.start },
      },
      select: { startsAt: true, endsAt: true, cancelledAt: true },
    });
  },

  createShifts(db: Prisma.TransactionClient, shifts: Prisma.ShiftCreateManyInput[]) {
    return db.shift.createMany({ data: shifts });
  },

  listPatientShifts(patientId: string, range: TimeRange) {
    return prisma.shift.findMany({
      where: { patientId, startsAt: { gte: range.start, lt: range.end } },
      select: SHIFT_FIELDS,
      orderBy: { startsAt: 'asc' },
    });
  },

  listCaregiverShifts(caregiverId: string, range: TimeRange) {
    return prisma.shift.findMany({
      where: {
        caregiverId,
        startsAt: { gte: range.start, lt: range.end },
        patient: {
          archivedAt: null,
          access: { some: { userId: caregiverId, revokedAt: null } },
        },
      },
      select: SHIFT_FIELDS,
      orderBy: { startsAt: 'asc' },
    });
  },

  findShift(patientId: string, shiftId: string) {
    return prisma.shift.findFirst({ where: { id: shiftId, patientId }, select: SHIFT_FIELDS });
  },

  cancelShift(db: Prisma.TransactionClient, shiftId: string, now: Date) {
    return db.shift.updateMany({
      where: { id: shiftId, cancelledAt: null, visits: { none: {} } },
      data: { cancelledAt: now },
    });
  },

  findAttachableShifts(caregiverId: string, patientId: string, around: Date, windowMs: number) {
    return prisma.shift.findMany({
      where: {
        ...activeShifts,
        caregiverId,
        patientId,
        startsAt: { lte: new Date(around.getTime() + windowMs) },
        endsAt: { gt: around },
        visits: { none: {} },
      },
      select: { id: true, startsAt: true, endsAt: true, cancelledAt: true },
      orderBy: { startsAt: 'asc' },
    });
  },

  createVisit(db: Prisma.TransactionClient, data: Prisma.VisitUncheckedCreateInput) {
    return db.visit.create({ data, select: VISIT_FIELDS });
  },

  findOpenVisit(caregiverId: string) {
    return prisma.visit.findUnique({
      where: { openForCaregiverId: caregiverId },
      select: {
        ...VISIT_FIELDS,
        shift: { select: { startsAt: true, endsAt: true, cancelledAt: true } },
      },
    });
  },

  closeVisit(db: Prisma.TransactionClient, visitId: string, data: Prisma.VisitUpdateInput) {
    return db.visit.update({ where: { id: visitId }, data, select: VISIT_FIELDS });
  },

  listPatientVisits(patientId: string, range: TimeRange) {
    return prisma.visit.findMany({
      where: { patientId, checkInAt: { gte: range.start, lt: range.end } },
      select: VISIT_FIELDS,
      orderBy: { checkInAt: 'desc' },
    });
  },
};
