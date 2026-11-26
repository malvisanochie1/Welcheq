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
} as const;

export type AuditAction = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];

export interface AuditEntry {
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}

export function recordAuditEvent(db: Prisma.TransactionClient, entry: AuditEntry) {
  return db.auditEvent.create({ data: entry });
}
