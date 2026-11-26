import { describe, expect, it } from 'vitest';

import { toFhirBundle, type FhirSource } from './fhir.mapper';

const source: FhirSource = {
  patient: {
    id: '11111111-1111-4111-8111-111111111111',
    fullName: 'Ngozi Okafor',
    dateOfBirth: new Date('1948-03-14T00:00:00Z'),
    homeAddress: '12 Ogui Road, Enugu',
    phone: null,
  },
  allergies: [
    {
      id: '22222222-2222-4222-8222-222222222222',
      substance: 'Penicillin',
      reaction: 'Rash',
      severity: 'SEVERE',
    },
  ],
  medications: [],
  conditions: [],
  readings: [
    {
      id: '33333333-3333-4333-8333-333333333333',
      type: 'BLOOD_PRESSURE',
      value: 138,
      secondaryValue: 86,
      measuredAt: new Date('2026-11-26T09:00:00Z'),
    },
  ],
};

describe('toFhirBundle', () => {
  const bundle = toFhirBundle(source, new Date('2026-11-27T10:00:00Z'));
  const resources = bundle.entry.map((entry) => entry.resource);

  it('starts with the patient', () => {
    expect(resources[0]).toMatchObject({ resourceType: 'Patient', birthDate: '1948-03-14' });
  });

  it('marks severe allergies as high criticality', () => {
    expect(resources[1]).toMatchObject({ resourceType: 'AllergyIntolerance', criticality: 'high' });
  });

  it('splits blood pressure into systolic and diastolic with LOINC codes', () => {
    expect(resources[2]).toMatchObject({
      resourceType: 'Observation',
      component: [
        { code: { coding: [{ code: '8480-6' }] }, valueQuantity: { value: 138 } },
        { code: { coding: [{ code: '8462-4' }] }, valueQuantity: { value: 86 } },
      ],
    });
  });
});
