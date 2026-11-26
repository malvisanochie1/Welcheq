import type { CareRelationship } from '@welcheq/shared';

import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export const PATIENT_FIELDS = {
  id: true,
  fullName: true,
  dateOfBirth: true,
  homeAddress: true,
  homeLatitude: true,
  homeLongitude: true,
  geofenceRadiusMeters: true,
  proofMethods: true,
  timeZone: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.PatientSelect;

export type PatientRecord = Prisma.PatientGetPayload<{ select: typeof PATIENT_FIELDS }>;

const activeAccessFor = (userId: string) => ({ userId, revokedAt: null });

export const patientRepository = {
  findAccess(userId: string, patientId: string) {
    return prisma.patientAccess.findFirst({
      where: { ...activeAccessFor(userId), patientId, patient: { archivedAt: null } },
      select: { relationship: true },
    });
  },

  listAccessible(userId: string) {
    return prisma.patientAccess.findMany({
      where: { ...activeAccessFor(userId), patient: { archivedAt: null } },
      select: { relationship: true, patient: { select: PATIENT_FIELDS } },
      orderBy: { patient: { fullName: 'asc' } },
    });
  },

  findById(patientId: string) {
    return prisma.patient.findUniqueOrThrow({ where: { id: patientId }, select: PATIENT_FIELDS });
  },

  createWithOwner(
    db: Prisma.TransactionClient,
    ownerId: string,
    data: Omit<Prisma.PatientUncheckedCreateInput, 'createdById'>,
    relationship: CareRelationship,
  ) {
    return db.patient.create({
      data: {
        ...data,
        createdById: ownerId,
        access: { create: { userId: ownerId, relationship, grantedById: ownerId } },
      },
      select: PATIENT_FIELDS,
    });
  },

  update(db: Prisma.TransactionClient, patientId: string, data: Prisma.PatientUpdateInput) {
    return db.patient.update({ where: { id: patientId }, data, select: PATIENT_FIELDS });
  },
};
