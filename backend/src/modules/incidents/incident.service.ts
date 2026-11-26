import {
  INCIDENT_CATEGORY_LABELS,
  INCIDENT_STATUS,
  PATIENT_EDITOR_RELATIONSHIPS,
  type IncidentInput,
  type IncidentStatus,
} from '@welcheq/shared';

import { AUDIT_ACTION, recordAuditEvent } from '@/lib/audit';
import { careTeamNotices } from '@/modules/notifications/care-team-notices';
import { HttpError } from '@/lib/http-error';
import { prisma } from '@/lib/prisma';
import type { ActingUser } from '@/middleware/require-profile';
import { requirePatientAccess } from '@/modules/patients/patient-access';

const CLOCK_SKEW_MS = 5 * 60_000;
const MAX_INCIDENT_AGE_DAYS = 30;
const DAY_MS = 86_400_000;
const MAX_LISTED = 100;

const INCIDENT_FIELDS = {
  id: true,
  category: true,
  severity: true,
  description: true,
  occurredAt: true,
  status: true,
  resolutionNote: true,
  resolvedAt: true,
  createdAt: true,
  reportedBy: { select: { fullName: true } },
  resolvedBy: { select: { fullName: true } },
} as const;

type IncidentRecord = Awaited<ReturnType<typeof findIncident>>;

function findIncident(patientId: string, incidentId: string) {
  return prisma.incident.findFirst({
    where: { id: incidentId, patientId },
    select: INCIDENT_FIELDS,
  });
}

function toIncidentResponse(incident: NonNullable<IncidentRecord>) {
  return {
    ...incident,
    reportedBy: incident.reportedBy.fullName,
    resolvedBy: incident.resolvedBy?.fullName ?? null,
  };
}

export const incidentService = {
  async report(user: ActingUser, patientId: string, input: IncidentInput) {
    await requirePatientAccess(user, patientId);

    const occurredAt = new Date(input.occurredAt);
    const now = Date.now();
    if (
      occurredAt.getTime() > now + CLOCK_SKEW_MS ||
      occurredAt.getTime() < now - MAX_INCIDENT_AGE_DAYS * DAY_MS
    ) {
      throw HttpError.invalid('Check when this happened.');
    }

    const incident = await prisma.$transaction(async (tx) => {
      const created = await tx.incident.create({
        data: { patientId, reportedById: user.id, ...input, occurredAt },
        select: INCIDENT_FIELDS,
      });
      await recordAuditEvent(tx, {
        actorId: user.id,
        action: AUDIT_ACTION.INCIDENT_REPORTED,
        entityType: 'incident',
        entityId: created.id,
        metadata: { patientId, category: input.category, severity: input.severity },
      });
      await careTeamNotices.incidentReported(tx, {
        id: created.id,
        patientId,
        reporterId: user.id,
        categoryLabel: INCIDENT_CATEGORY_LABELS[input.category],
      });
      return created;
    });

    return toIncidentResponse(incident);
  },

  async list(user: ActingUser, patientId: string, status?: IncidentStatus) {
    await requirePatientAccess(user, patientId);
    const incidents = await prisma.incident.findMany({
      where: { patientId, ...(status ? { status } : {}) },
      select: INCIDENT_FIELDS,
      orderBy: [{ status: 'asc' }, { occurredAt: 'desc' }],
      take: MAX_LISTED,
    });
    return incidents.map(toIncidentResponse);
  },

  async resolve(user: ActingUser, patientId: string, incidentId: string, resolutionNote: string) {
    await requirePatientAccess(user, patientId, PATIENT_EDITOR_RELATIONSHIPS);

    await prisma.$transaction(async (tx) => {
      const { count } = await tx.incident.updateMany({
        where: { id: incidentId, patientId, status: INCIDENT_STATUS.OPEN },
        data: {
          status: INCIDENT_STATUS.RESOLVED,
          resolutionNote,
          resolvedAt: new Date(),
          resolvedById: user.id,
        },
      });
      if (count === 0) {
        throw HttpError.notFound('Open incident not found');
      }
      await recordAuditEvent(tx, {
        actorId: user.id,
        action: AUDIT_ACTION.INCIDENT_RESOLVED,
        entityType: 'incident',
        entityId: incidentId,
      });
      await careTeamNotices.incidentResolved(tx, {
        id: incidentId,
        patientId,
        resolverId: user.id,
      });
    });

    const resolved = await findIncident(patientId, incidentId);
    if (!resolved) {
      throw HttpError.notFound('Incident not found');
    }
    return toIncidentResponse(resolved);
  },
};
