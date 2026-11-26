import {
  CARE_RELATIONSHIP,
  PATIENT_EDITOR_RELATIONSHIPS,
  PATIENT_MANAGER_ROLES,
  type ProofSettingsInput,
  type UpdatePatientInput,
  type createPatientSchema,
} from '@welcheq/shared';
import type { z } from 'zod';

import { AUDIT_ACTION, recordAuditEvent } from '@/lib/audit';
import { HttpError } from '@/lib/http-error';
import { prisma } from '@/lib/prisma';
import type { ActingUser } from '@/middleware/require-profile';
import { toPatientResponse } from './patient.mapper';
import { requirePatientAccess } from './patient-access';
import { patientRepository } from './patient.repository';

type CreatePatientData = z.output<typeof createPatientSchema>;

const ENTITY_TYPE = 'patient';

const toDate = (isoDate: string | null | undefined) =>
  isoDate === undefined ? undefined : isoDate === null ? null : new Date(isoDate);

export const patientService = {
  async create(user: ActingUser, input: CreatePatientData) {
    if (!(PATIENT_MANAGER_ROLES as readonly string[]).includes(user.role)) {
      throw HttpError.forbidden('Only families and agencies can register patients');
    }

    const patient = await prisma.$transaction(async (tx) => {
      const created = await patientRepository.createWithOwner(
        tx,
        user.id,
        {
          fullName: input.fullName,
          dateOfBirth: toDate(input.dateOfBirth),
          homeAddress: input.homeAddress,
          homeLatitude: input.homeLocation.latitude,
          homeLongitude: input.homeLocation.longitude,
          proofMethods: input.proofSettings.methods,
          geofenceRadiusMeters: input.proofSettings.geofenceRadiusMeters,
        },
        CARE_RELATIONSHIP.OWNER,
      );
      await recordAuditEvent(tx, {
        actorId: user.id,
        action: AUDIT_ACTION.PATIENT_CREATED,
        entityType: ENTITY_TYPE,
        entityId: created.id,
      });
      return created;
    });

    return toPatientResponse(patient, CARE_RELATIONSHIP.OWNER);
  },

  async list(user: ActingUser) {
    const entries = await patientRepository.listAccessible(user.id);
    return entries.map(({ patient, relationship }) => toPatientResponse(patient, relationship));
  },

  async get(user: ActingUser, patientId: string) {
    const relationship = await requirePatientAccess(user, patientId);
    return toPatientResponse(await patientRepository.findById(patientId), relationship);
  },

  async update(user: ActingUser, patientId: string, input: UpdatePatientInput) {
    const relationship = await requirePatientAccess(user, patientId, PATIENT_EDITOR_RELATIONSHIPS);

    const patient = await prisma.$transaction(async (tx) => {
      const updated = await patientRepository.update(tx, patientId, {
        fullName: input.fullName,
        dateOfBirth: toDate(input.dateOfBirth),
        homeAddress: input.homeAddress,
        homeLatitude: input.homeLocation?.latitude,
        homeLongitude: input.homeLocation?.longitude,
      });
      await recordAuditEvent(tx, {
        actorId: user.id,
        action: AUDIT_ACTION.PATIENT_UPDATED,
        entityType: ENTITY_TYPE,
        entityId: patientId,
        metadata: { fields: Object.keys(input) },
      });
      return updated;
    });

    return toPatientResponse(patient, relationship);
  },

  async updateProofSettings(user: ActingUser, patientId: string, input: ProofSettingsInput) {
    const relationship = await requirePatientAccess(user, patientId, PATIENT_EDITOR_RELATIONSHIPS);

    const patient = await prisma.$transaction(async (tx) => {
      const updated = await patientRepository.update(tx, patientId, {
        proofMethods: input.methods,
        geofenceRadiusMeters: input.geofenceRadiusMeters,
      });
      await recordAuditEvent(tx, {
        actorId: user.id,
        action: AUDIT_ACTION.PATIENT_PROOF_SETTINGS_UPDATED,
        entityType: ENTITY_TYPE,
        entityId: patientId,
        metadata: { methods: input.methods, geofenceRadiusMeters: input.geofenceRadiusMeters },
      });
      return updated;
    });

    return toPatientResponse(patient, relationship);
  },
};
