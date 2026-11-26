import { NOTIFICATION_KIND, WELLBEING, type Wellbeing } from '@welcheq/shared';

import type { Prisma } from '@/generated/prisma/client';
import { NOTIFY_EVERYONE, NOTIFY_FAMILY, notifyCareTeam } from './notification.service';

type Db = Prisma.TransactionClient;

const WELLBEING_WORDS: Readonly<Record<Wellbeing, string>> = {
  [WELLBEING.GOOD]: 'was doing well',
  [WELLBEING.OKAY]: 'was okay',
  [WELLBEING.UNWELL]: 'was unwell',
};

const firstName = (fullName: string) => fullName.split(' ')[0] ?? fullName;

async function names(db: Db, patientId: string, personId: string) {
  const [patient, person] = await Promise.all([
    db.patient.findUniqueOrThrow({ where: { id: patientId }, select: { fullName: true } }),
    db.user.findUniqueOrThrow({ where: { id: personId }, select: { fullName: true } }),
  ]);
  return { patient: firstName(patient.fullName), person: firstName(person.fullName) };
}

export const careTeamNotices = {
  async caregiverArrived(
    db: Db,
    visit: { id: string; patientId: string; caregiverId: string; isLate: boolean },
  ) {
    const { patient, person } = await names(db, visit.patientId, visit.caregiverId);
    await notifyCareTeam(db, {
      patientId: visit.patientId,
      actorId: visit.caregiverId,
      audience: NOTIFY_FAMILY,
      kind: NOTIFICATION_KIND.CAREGIVER_ARRIVED,
      title: `${person} arrived${visit.isLate ? ' late' : ''}`,
      body: `Checked in at ${patient}'s home.`,
      entityId: visit.id,
      dedupeKey: `visit-arrived:${visit.id}`,
    });
  },

  async caregiverLeft(
    db: Db,
    visit: { id: string; patientId: string; caregiverId: string; leftEarly: boolean },
  ) {
    const { patient, person } = await names(db, visit.patientId, visit.caregiverId);
    await notifyCareTeam(db, {
      patientId: visit.patientId,
      actorId: visit.caregiverId,
      audience: NOTIFY_FAMILY,
      kind: NOTIFICATION_KIND.CAREGIVER_LEFT,
      title: `${person} left${visit.leftEarly ? ' early' : ''}`,
      body: `Checked out of ${patient}'s home.`,
      entityId: visit.id,
      dedupeKey: `visit-left:${visit.id}`,
    });
  },

  async visitReport(
    db: Db,
    report: { visitId: string; patientId: string; authorId: string; wellbeing: Wellbeing },
  ) {
    const { patient, person } = await names(db, report.patientId, report.authorId);
    await notifyCareTeam(db, {
      patientId: report.patientId,
      actorId: report.authorId,
      audience: NOTIFY_FAMILY,
      kind: NOTIFICATION_KIND.VISIT_REPORT,
      title: `Visit report from ${person}`,
      body: `${patient} ${WELLBEING_WORDS[report.wellbeing]}.`,
      entityId: report.visitId,
      dedupeKey: `visit-report:${report.visitId}`,
    });
  },

  async incidentReported(
    db: Db,
    incident: { id: string; patientId: string; reporterId: string; categoryLabel: string },
  ) {
    const { patient, person } = await names(db, incident.patientId, incident.reporterId);
    await notifyCareTeam(db, {
      patientId: incident.patientId,
      actorId: incident.reporterId,
      audience: NOTIFY_EVERYONE,
      kind: NOTIFICATION_KIND.INCIDENT_REPORTED,
      title: `Incident: ${incident.categoryLabel}`,
      body: `${person} reported something about ${patient}.`,
      entityId: incident.id,
      dedupeKey: `incident-reported:${incident.id}`,
    });
  },

  async incidentResolved(db: Db, incident: { id: string; patientId: string; resolverId: string }) {
    const { patient, person } = await names(db, incident.patientId, incident.resolverId);
    await notifyCareTeam(db, {
      patientId: incident.patientId,
      actorId: incident.resolverId,
      audience: NOTIFY_EVERYONE,
      kind: NOTIFICATION_KIND.INCIDENT_RESOLVED,
      title: 'Incident resolved',
      body: `${person} recorded how the incident with ${patient} was handled.`,
      entityId: incident.id,
      dedupeKey: `incident-resolved:${incident.id}`,
    });
  },

  async callMismatch(
    db: Db,
    call: { id: string; patientId: string; callerId: string; mismatchCount: number },
  ) {
    const { patient, person } = await names(db, call.patientId, call.callerId);
    const things = call.mismatchCount === 1 ? '1 thing' : `${call.mismatchCount} things`;
    await notifyCareTeam(db, {
      patientId: call.patientId,
      actorId: call.callerId,
      audience: NOTIFY_FAMILY,
      kind: NOTIFICATION_KIND.CALL_MISMATCH,
      title: `${patient}'s answers don't match`,
      body: `On ${person}'s call, ${patient} disagreed with the caregiver about ${things}.`,
      entityId: call.id,
      dedupeKey: `call-mismatch:${call.id}`,
    });
  },
};
