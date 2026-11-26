import {
  ALLERGY_SEVERITY,
  READING_TYPE,
  type AllergySeverity,
  type ReadingType,
} from '@welcheq/shared';

/** FHIR R4 resources, limited to the fields Welcheq fills in. */
type Resource = { resourceType: string; id: string } & Record<string, unknown>;

export interface FhirSource {
  patient: {
    id: string;
    fullName: string;
    dateOfBirth: Date | null;
    homeAddress: string;
    phone: string | null;
  };
  allergies: Array<{
    id: string;
    substance: string;
    reaction: string | null;
    severity: AllergySeverity;
  }>;
  medications: Array<{
    id: string;
    name: string;
    dose: string | null;
    instructions: string | null;
    stoppedAt: Date | null;
    createdAt: Date;
  }>;
  conditions: Array<{ id: string; name: string; notes: string | null; diagnosedOn: Date | null }>;
  readings: Array<{
    id: string;
    type: ReadingType;
    value: number;
    secondaryValue: number | null;
    measuredAt: Date;
  }>;
}

const LOINC = 'http://loinc.org';
const UCUM = 'http://unitsofmeasure.org';
const OBSERVATION_CATEGORY = 'http://terminology.hl7.org/CodeSystem/observation-category';

const READING_CODES: Readonly<
  Record<ReadingType, { code: string; display: string; unit: string }>
> = {
  [READING_TYPE.BLOOD_PRESSURE]: {
    code: '85354-9',
    display: 'Blood pressure panel',
    unit: 'mm[Hg]',
  },
  [READING_TYPE.HEART_RATE]: { code: '8867-4', display: 'Heart rate', unit: '/min' },
  [READING_TYPE.TEMPERATURE]: { code: '8310-5', display: 'Body temperature', unit: 'Cel' },
  [READING_TYPE.BLOOD_GLUCOSE]: {
    code: '2339-0',
    display: 'Glucose [Mass/volume] in Blood',
    unit: 'mg/dL',
  },
  [READING_TYPE.OXYGEN_SATURATION]: {
    code: '59408-5',
    display: 'Oxygen saturation in Arterial blood by Pulse oximetry',
    unit: '%',
  },
  [READING_TYPE.WEIGHT]: { code: '29463-7', display: 'Body weight', unit: 'kg' },
};

const BLOOD_PRESSURE_PARTS = {
  systolic: { code: '8480-6', display: 'Systolic blood pressure' },
  diastolic: { code: '8462-4', display: 'Diastolic blood pressure' },
} as const;

const ALLERGY_REACTION_SEVERITY: Readonly<Record<AllergySeverity, string>> = {
  [ALLERGY_SEVERITY.MILD]: 'mild',
  [ALLERGY_SEVERITY.MODERATE]: 'moderate',
  [ALLERGY_SEVERITY.SEVERE]: 'severe',
};

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const loinc = (code: string, display: string) => ({
  coding: [{ system: LOINC, code, display }],
  text: display,
});
const quantity = (value: number, unit: string) => ({ value, unit, system: UCUM, code: unit });

function patientResource({ patient }: FhirSource): Resource {
  return {
    resourceType: 'Patient',
    id: patient.id,
    name: [{ text: patient.fullName }],
    ...(patient.dateOfBirth ? { birthDate: isoDate(patient.dateOfBirth) } : {}),
    address: [{ text: patient.homeAddress }],
    ...(patient.phone ? { telecom: [{ system: 'phone', value: patient.phone }] } : {}),
  };
}

function observation(reading: FhirSource['readings'][number], subject: object): Resource {
  const spec = READING_CODES[reading.type];
  const base = {
    resourceType: 'Observation',
    id: reading.id,
    status: 'final',
    category: [{ coding: [{ system: OBSERVATION_CATEGORY, code: 'vital-signs' }] }],
    code: loinc(spec.code, spec.display),
    subject,
    effectiveDateTime: reading.measuredAt.toISOString(),
  };
  if (reading.type !== READING_TYPE.BLOOD_PRESSURE || reading.secondaryValue === null) {
    return { ...base, valueQuantity: quantity(reading.value, spec.unit) };
  }
  return {
    ...base,
    component: [
      {
        code: loinc(BLOOD_PRESSURE_PARTS.systolic.code, BLOOD_PRESSURE_PARTS.systolic.display),
        valueQuantity: quantity(reading.value, spec.unit),
      },
      {
        code: loinc(BLOOD_PRESSURE_PARTS.diastolic.code, BLOOD_PRESSURE_PARTS.diastolic.display),
        valueQuantity: quantity(reading.secondaryValue, spec.unit),
      },
    ],
  };
}

/** Builds a FHIR R4 collection bundle that clinic and hospital systems can import. */
export function toFhirBundle(source: FhirSource, generatedAt: Date) {
  const subject = { reference: `Patient/${source.patient.id}` };

  const resources: Resource[] = [
    patientResource(source),
    ...source.allergies.map((allergy) => ({
      resourceType: 'AllergyIntolerance',
      id: allergy.id,
      clinicalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
            code: 'active',
          },
        ],
      },
      criticality: allergy.severity === ALLERGY_SEVERITY.SEVERE ? 'high' : 'low',
      code: { text: allergy.substance },
      patient: subject,
      reaction: [
        {
          ...(allergy.reaction ? { description: allergy.reaction } : {}),
          severity: ALLERGY_REACTION_SEVERITY[allergy.severity],
          manifestation: [{ text: allergy.reaction ?? 'Not recorded' }],
        },
      ],
    })),
    ...source.medications.map((medication) => ({
      resourceType: 'MedicationStatement',
      id: medication.id,
      status: medication.stoppedAt ? 'stopped' : 'active',
      medicationCodeableConcept: { text: medication.name },
      subject,
      effectivePeriod: {
        start: medication.createdAt.toISOString(),
        ...(medication.stoppedAt ? { end: medication.stoppedAt.toISOString() } : {}),
      },
      dosage: [{ text: [medication.dose, medication.instructions].filter(Boolean).join(', ') }],
    })),
    ...source.conditions.map((condition) => ({
      resourceType: 'Condition',
      id: condition.id,
      clinicalStatus: {
        coding: [
          { system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' },
        ],
      },
      code: { text: condition.name },
      subject,
      ...(condition.diagnosedOn ? { onsetDateTime: isoDate(condition.diagnosedOn) } : {}),
      ...(condition.notes ? { note: [{ text: condition.notes }] } : {}),
    })),
    ...source.readings.map((reading) => observation(reading, subject)),
  ];

  return {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: generatedAt.toISOString(),
    entry: resources.map((resource) => ({
      fullUrl: `urn:uuid:${resource.id}`,
      resource,
    })),
  };
}
