import { MESSAGE_RULES, NOTIFICATION_KIND } from '@welcheq/shared';

import { prisma } from '@/lib/prisma';
import type { ActingUser } from '@/middleware/require-profile';
import { NOTIFY_EVERYONE, notifyCareTeam } from '@/modules/notifications/notification.service';
import { requirePatientAccess } from '@/modules/patients/patient-access';

const MESSAGE_FIELDS = {
  id: true,
  body: true,
  createdAt: true,
  author: { select: { id: true, fullName: true } },
} as const;

function preview(body: string): string {
  return body.length > MESSAGE_RULES.PREVIEW_LENGTH
    ? `${body.slice(0, MESSAGE_RULES.PREVIEW_LENGTH).trimEnd()}…`
    : body;
}

export const messageService = {
  /** The latest page, oldest first, so it reads top to bottom like a chat. */
  async list(user: ActingUser, patientId: string, before?: string) {
    await requirePatientAccess(user, patientId);
    const messages = await prisma.message.findMany({
      where: { patientId, ...(before ? { createdAt: { lt: new Date(before) } } : {}) },
      select: MESSAGE_FIELDS,
      orderBy: { createdAt: 'desc' },
      take: MESSAGE_RULES.PAGE_SIZE,
    });
    return messages.reverse();
  },

  async send(user: ActingUser, patientId: string, body: string) {
    await requirePatientAccess(user, patientId);
    return prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: { patientId, authorId: user.id, body },
        select: MESSAGE_FIELDS,
      });
      await notifyCareTeam(tx, {
        patientId,
        actorId: user.id,
        audience: NOTIFY_EVERYONE,
        kind: NOTIFICATION_KIND.MESSAGE,
        title: `Message from ${message.author.fullName.split(' ')[0]}`,
        body: preview(body),
        entityId: message.id,
        dedupeKey: `message:${message.id}`,
      });
      return message;
    });
  },
};
