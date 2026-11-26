import {
  ATTENDANCE_FLAG,
  CARE_RELATIONSHIP,
  FAMILY_RELATIONSHIPS,
  REVIEW_RULES,
} from '@welcheq/shared';

import { HttpError } from '@/lib/http-error';
import { prisma } from '@/lib/prisma';
import type { ActingUser } from '@/middleware/require-profile';
import { requirePatientAccess } from '@/modules/patients/patient-access';

type ReviewData = { rating: number; comment?: string | null };

const DAY_MS = 86_400_000;
const firstName = (fullName: string) => fullName.split(' ')[0] ?? fullName;

async function requireCaregiverOnTeam(patientId: string, caregiverId: string) {
  const access = await prisma.patientAccess.findFirst({
    where: { patientId, userId: caregiverId, relationship: CARE_RELATIONSHIP.CAREGIVER },
    select: { user: { select: { fullName: true, phone: true } } },
  });
  if (!access) {
    throw HttpError.notFound('Caregiver not found');
  }
  return access.user;
}

async function hasCompletedVisit(patientId: string, caregiverId: string) {
  const visit = await prisma.visit.findFirst({
    where: { patientId, caregiverId, checkOutAt: { not: null } },
    select: { id: true },
  });
  return visit !== null;
}

async function trackRecord(caregiverId: string) {
  const now = new Date();
  const since = new Date(now.getTime() - REVIEW_RULES.TRACK_RECORD_DAYS * DAY_MS);
  const [visits, late, earlyDepartures, missed] = await Promise.all([
    prisma.visit.count({
      where: { caregiverId, checkInAt: { gte: since }, checkOutAt: { not: null } },
    }),
    prisma.visit.count({
      where: {
        caregiverId,
        checkInAt: { gte: since },
        flags: { has: ATTENDANCE_FLAG.LATE_ARRIVAL },
      },
    }),
    prisma.visit.count({
      where: {
        caregiverId,
        checkInAt: { gte: since },
        flags: { has: ATTENDANCE_FLAG.EARLY_DEPARTURE },
      },
    }),
    prisma.shift.count({
      where: {
        caregiverId,
        cancelledAt: null,
        startsAt: { gte: since },
        endsAt: { lt: now },
        visits: { none: {} },
      },
    }),
  ]);
  return { days: REVIEW_RULES.TRACK_RECORD_DAYS, visits, late, earlyDepartures, missed };
}

export const reviewService = {
  async caregiverProfile(user: ActingUser, patientId: string, caregiverId: string) {
    const relationship = await requirePatientAccess(user, patientId);
    const caregiver = await requireCaregiverOnTeam(patientId, caregiverId);

    const [ratings, recent, ownReview, record, completed] = await Promise.all([
      prisma.caregiverReview.aggregate({
        where: { caregiverId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.caregiverReview.findMany({
        where: { caregiverId },
        select: {
          id: true,
          rating: true,
          comment: true,
          updatedAt: true,
          reviewer: { select: { fullName: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: REVIEW_RULES.RECENT_REVIEWS,
      }),
      prisma.caregiverReview.findUnique({
        where: {
          patientId_caregiverId_reviewerId: { patientId, caregiverId, reviewerId: user.id },
        },
        select: { rating: true, comment: true },
      }),
      trackRecord(caregiverId),
      hasCompletedVisit(patientId, caregiverId),
    ]);

    return {
      caregiver: { id: caregiverId, fullName: caregiver.fullName, phone: caregiver.phone },
      rating: {
        average: ratings._avg.rating,
        count: ratings._count.rating,
      },
      reviews: recent.map(({ reviewer, ...review }) => ({
        ...review,
        reviewer: firstName(reviewer.fullName),
      })),
      trackRecord: record,
      ownReview,
      canReview: (FAMILY_RELATIONSHIPS as readonly string[]).includes(relationship) && completed,
    };
  },

  async review(user: ActingUser, patientId: string, caregiverId: string, input: ReviewData) {
    await requirePatientAccess(user, patientId, FAMILY_RELATIONSHIPS);
    await requireCaregiverOnTeam(patientId, caregiverId);
    if (!(await hasCompletedVisit(patientId, caregiverId))) {
      throw HttpError.conflict('You can review a caregiver after their first completed visit.');
    }

    const data = { rating: input.rating, comment: input.comment ?? null };
    await prisma.caregiverReview.upsert({
      where: { patientId_caregiverId_reviewerId: { patientId, caregiverId, reviewerId: user.id } },
      create: { patientId, caregiverId, reviewerId: user.id, ...data },
      update: data,
    });
  },
};
