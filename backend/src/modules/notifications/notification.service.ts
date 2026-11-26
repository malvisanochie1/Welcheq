import {
  ATTENDANCE_RULES,
  CARE_RELATIONSHIP,
  FAMILY_RELATIONSHIPS,
  NOTIFICATION_KIND,
  NOTIFICATION_RULES,
  type CareRelationship,
  type NotificationKind,
} from '@welcheq/shared';

import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { ActingUser } from '@/middleware/require-profile';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export const NOTIFY_FAMILY: readonly CareRelationship[] = FAMILY_RELATIONSHIPS;
export const NOTIFY_EVERYONE: readonly CareRelationship[] = [
  ...FAMILY_RELATIONSHIPS,
  CARE_RELATIONSHIP.CAREGIVER,
];

export interface CareTeamNotice {
  patientId: string;
  actorId: string | null;
  audience: readonly CareRelationship[];
  kind: NotificationKind;
  title: string;
  body: string;
  entityId?: string;
  /** Repeating an event with the same key never notifies anyone twice. */
  dedupeKey: string;
}

const firstName = (fullName: string) => fullName.split(' ')[0] ?? fullName;

/** Sends one notice to everyone in the audience on this patient's care team, except the actor. */
export async function notifyCareTeam(db: Prisma.TransactionClient, notice: CareTeamNotice) {
  const recipients = await db.patientAccess.findMany({
    where: {
      patientId: notice.patientId,
      relationship: { in: [...notice.audience] },
      ...(notice.actorId ? { userId: { not: notice.actorId } } : {}),
    },
    select: { userId: true },
  });
  if (recipients.length === 0) return;

  await db.notification.createMany({
    data: recipients.map(({ userId }) => ({
      userId,
      patientId: notice.patientId,
      kind: notice.kind,
      title: notice.title,
      body: notice.body,
      entityId: notice.entityId ?? null,
      dedupeKey: notice.dedupeKey,
    })),
    skipDuplicates: true,
  });
}

/**
 * Missed visits have no event of their own, so they are found when someone looks: any visit
 * that should have started over an hour ago, with no check-in, is announced once to the family.
 */
async function announceMissedVisits(user: ActingUser) {
  const now = Date.now();
  const families = await prisma.patientAccess.findMany({
    where: { userId: user.id, relationship: { in: [...FAMILY_RELATIONSHIPS] } },
    select: { patientId: true },
  });
  if (families.length === 0) return;

  const missed = await prisma.shift.findMany({
    where: {
      patientId: { in: families.map(({ patientId }) => patientId) },
      cancelledAt: null,
      startsAt: {
        gte: new Date(now - NOTIFICATION_RULES.MISSED_VISIT_LOOKBACK_HOURS * HOUR_MS),
        lte: new Date(now - ATTENDANCE_RULES.MISSED_AFTER_MINUTES * MINUTE_MS),
      },
      visits: { none: {} },
    },
    select: {
      id: true,
      patientId: true,
      caregiver: { select: { fullName: true } },
      patient: { select: { fullName: true } },
    },
  });

  for (const shift of missed) {
    await notifyCareTeam(prisma, {
      patientId: shift.patientId,
      actorId: null,
      audience: NOTIFY_FAMILY,
      kind: NOTIFICATION_KIND.VISIT_MISSED,
      title: `${firstName(shift.caregiver.fullName)} has not arrived`,
      body: `The visit to ${firstName(shift.patient.fullName)} has not started. You may want to call.`,
      entityId: shift.id,
      dedupeKey: `visit-missed:${shift.id}`,
    });
  }
}

const NOTIFICATION_FIELDS = {
  id: true,
  patientId: true,
  kind: true,
  title: true,
  body: true,
  entityId: true,
  readAt: true,
  createdAt: true,
} as const;

export const notificationService = {
  async list(user: ActingUser) {
    await announceMissedVisits(user);
    await prisma.notification.deleteMany({
      where: {
        userId: user.id,
        createdAt: { lt: new Date(Date.now() - NOTIFICATION_RULES.KEEP_DAYS * DAY_MS) },
      },
    });

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        select: NOTIFICATION_FIELDS,
        orderBy: { createdAt: 'desc' },
        take: NOTIFICATION_RULES.PAGE_SIZE,
      }),
      prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    ]);
    return { notifications, unreadCount };
  },

  async unreadCount(user: ActingUser) {
    await announceMissedVisits(user);
    return prisma.notification.count({ where: { userId: user.id, readAt: null } });
  },

  async markRead(user: ActingUser, ids: string[] | 'all') {
    await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null, ...(ids === 'all' ? {} : { id: { in: ids } }) },
      data: { readAt: new Date() },
    });
  },
};
