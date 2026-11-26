import type { CareRelationship } from '@welcheq/shared';

import type { PatientRecord } from './patient.repository';

export function toPatientResponse(patient: PatientRecord, relationship: CareRelationship) {
  return {
    id: patient.id,
    fullName: patient.fullName,
    dateOfBirth: patient.dateOfBirth?.toISOString().slice(0, 10) ?? null,
    homeAddress: patient.homeAddress,
    homeLocation: { latitude: patient.homeLatitude, longitude: patient.homeLongitude },
    proofSettings: {
      methods: patient.proofMethods,
      geofenceRadiusMeters: patient.geofenceRadiusMeters,
    },
    relationship,
    timeZone: patient.timeZone,
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
  };
}

export type PatientResponse = ReturnType<typeof toPatientResponse>;
