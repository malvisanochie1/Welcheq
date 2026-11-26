import type { PrismaClient } from '@/generated/prisma/client';

/** Deletes children before parents so foreign keys never block the reset. */
export async function resetDatabase(prisma: PrismaClient) {
  await prisma.auditEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.caregiverReview.deleteMany();
  await prisma.healthDocument.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.allergy.deleteMany();
  await prisma.condition.deleteMany();
  await prisma.healthReading.deleteMany();
  await prisma.visitReport.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.dailyCall.deleteMany();
  await prisma.surpriseCheck.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.homeDisplayPairing.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.taskRecord.deleteMany();
  await prisma.careTask.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.patientAccess.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();
}
