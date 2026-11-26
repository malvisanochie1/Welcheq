import {
  ATTENDANCE_FLAG,
  CARE_RELATIONSHIP,
  INCIDENT_STATUS,
  type DashboardPeriod,
} from '@welcheq/shared';

import { prisma } from '@/lib/prisma';
import type { ActingUser } from '@/middleware/require-profile';

const DAY_MS = 86_400_000;

interface Tally {
  scheduled: number;
  completed: number;
  late: number;
  missed: number;
}

const emptyTally = (): Tally => ({ scheduled: 0, completed: 0, late: 0, missed: 0 });

const onTimeRate = (tally: Tally) =>
  tally.completed === 0 ? null : (tally.completed - tally.late) / tally.completed;

export const dashboardService = {
  /** One view across every patient the person owns: attendance, incidents and caregivers. */
  async overview(user: ActingUser, days: DashboardPeriod) {
    const now = new Date();
    const since = new Date(now.getTime() - days * DAY_MS);

    const owned = await prisma.patientAccess.findMany({
      where: {
        userId: user.id,
        relationship: CARE_RELATIONSHIP.OWNER,
        patient: { archivedAt: null },
      },
      select: { patient: { select: { id: true, fullName: true } } },
    });
    const patientIds = owned.map(({ patient }) => patient.id);

    const [shifts, visits, openIncidents, latestReports, ratings] = await Promise.all([
      prisma.shift.findMany({
        where: {
          patientId: { in: patientIds },
          cancelledAt: null,
          startsAt: { gte: since, lte: now },
        },
        select: {
          patientId: true,
          caregiverId: true,
          endsAt: true,
          visits: { select: { id: true }, take: 1 },
        },
      }),
      prisma.visit.findMany({
        where: { patientId: { in: patientIds }, checkInAt: { gte: since } },
        select: {
          patientId: true,
          caregiverId: true,
          checkInAt: true,
          checkOutAt: true,
          flags: true,
          caregiver: { select: { fullName: true } },
        },
      }),
      prisma.incident.groupBy({
        by: ['patientId'],
        where: { patientId: { in: patientIds }, status: INCIDENT_STATUS.OPEN },
        _count: { _all: true },
      }),
      prisma.visitReport.findMany({
        where: { patientId: { in: patientIds } },
        select: { patientId: true, wellbeing: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        distinct: ['patientId'],
      }),
      prisma.caregiverReview.groupBy({
        by: ['caregiverId'],
        where: { patientId: { in: patientIds } },
        _avg: { rating: true },
      }),
    ]);

    const byPatient = new Map(patientIds.map((id) => [id, emptyTally()]));
    const byCaregiver = new Map<string, Tally & { fullName: string }>();
    const lastVisit = new Map<string, Date>();
    const caregiverTally = (id: string, fullName = '') => {
      const existing = byCaregiver.get(id);
      if (existing) {
        if (fullName) existing.fullName = fullName;
        return existing;
      }
      const created = { ...emptyTally(), fullName };
      byCaregiver.set(id, created);
      return created;
    };

    for (const shift of shifts) {
      const tallies = [byPatient.get(shift.patientId), caregiverTally(shift.caregiverId)];
      for (const tally of tallies) {
        if (!tally) continue;
        tally.scheduled += 1;
        if (shift.visits.length === 0 && shift.endsAt < now) tally.missed += 1;
      }
    }
    for (const visit of visits) {
      const isLate = visit.flags.includes(ATTENDANCE_FLAG.LATE_ARRIVAL);
      const tallies = [
        byPatient.get(visit.patientId),
        caregiverTally(visit.caregiverId, visit.caregiver.fullName),
      ];
      for (const tally of tallies) {
        if (!tally || !visit.checkOutAt) continue;
        tally.completed += 1;
        if (isLate) tally.late += 1;
      }
      const previous = lastVisit.get(visit.patientId);
      if (!previous || visit.checkInAt > previous) lastVisit.set(visit.patientId, visit.checkInAt);
    }

    const incidentCounts = new Map(openIncidents.map((row) => [row.patientId, row._count._all]));
    const wellbeing = new Map(latestReports.map((report) => [report.patientId, report.wellbeing]));
    const averageRating = new Map(ratings.map((row) => [row.caregiverId, row._avg.rating]));

    const totals = [...byPatient.values()].reduce(
      (sum, tally) => ({
        scheduled: sum.scheduled + tally.scheduled,
        completed: sum.completed + tally.completed,
        late: sum.late + tally.late,
        missed: sum.missed + tally.missed,
      }),
      emptyTally(),
    );

    return {
      days,
      totals: {
        ...totals,
        onTimeRate: onTimeRate(totals),
        openIncidents: [...incidentCounts.values()].reduce((sum, count) => sum + count, 0),
      },
      patients: owned.map(({ patient }) => {
        const tally = byPatient.get(patient.id) ?? emptyTally();
        return {
          id: patient.id,
          fullName: patient.fullName,
          ...tally,
          onTimeRate: onTimeRate(tally),
          openIncidents: incidentCounts.get(patient.id) ?? 0,
          lastVisitAt: lastVisit.get(patient.id) ?? null,
          latestWellbeing: wellbeing.get(patient.id) ?? null,
        };
      }),
      caregivers: [...byCaregiver.entries()]
        .filter(([, tally]) => tally.fullName)
        .map(([id, tally]) => ({
          id,
          ...tally,
          onTimeRate: onTimeRate(tally),
          averageRating: averageRating.get(id) ?? null,
        }))
        .sort((first, second) => second.completed - first.completed),
    };
  },
};
