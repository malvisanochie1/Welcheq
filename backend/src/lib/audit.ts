import type { Prisma } from '@/generated/prisma/client';

export const AUDIT_ACTION = {
  PATIENT_CREATED: 'patient.created',
  PATIENT_UPDATED: 'patient.updated',
  PATIENT_PROOF_SETTINGS_UPDATED: 'patient.proof_settings_updated',
  INVITATION_CREATED: 'invitation.created',
  INVITATION_REVOKED: 'invitation.revoked',
  INVITATION_ACCEPTED: 'invitation.accepted',
  MEMBER_REMOVED: 'member.removed',
  CARE_PLAN_CHANGED: 'care_plan.changed',
  TASK_RECORD_CHANGED: 'task_record.changed',
  SHIFTS_SCHEDULED: 'shifts.scheduled',
  SHIFT_CANCELLED: 'shift.cancelled',
  VISIT_CHECKED_IN: 'visit.checked_in',
  VISIT_CHECKED_OUT: 'visit.checked_out',
  HOME_DISPLAY_PAIRING_CREATED: 'home_display.pairing_created',
  HOME_DISPLAY_PAIRED: 'home_display.paired',
  HOME_DISPLAY_RESET: 'home_display.reset',
  SURPRISE_CHECK_ANSWERED: 'surprise_check.answered',
  PATIENT_CONTACT_UPDATED: 'patient.contact_updated',
  VISIT_REPORT_CHANGED: 'visit_report.changed',
  INCIDENT_REPORTED: 'incident.reported',
  INCIDENT_RESOLVED: 'incident.resolved',
  HEALTH_PROFILE_ENTRY_REMOVED: 'health_profile.entry_removed',
  HEALTH_DOCUMENT_ADDED: 'health_document.added',
  HEALTH_DOCUMENT_REMOVED: 'health_document.removed',
} as const;

export type AuditAction = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];

export interface AuditEntry {
  actorId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}

export function recordAuditEvent(db: Prisma.TransactionClient, entry: AuditEntry) {
  return db.auditEvent.create({ data: entry });
}
