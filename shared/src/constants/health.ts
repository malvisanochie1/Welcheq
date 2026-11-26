export const READING_TYPE = {
  BLOOD_PRESSURE: 'BLOOD_PRESSURE',
  HEART_RATE: 'HEART_RATE',
  TEMPERATURE: 'TEMPERATURE',
  BLOOD_GLUCOSE: 'BLOOD_GLUCOSE',
  OXYGEN_SATURATION: 'OXYGEN_SATURATION',
  WEIGHT: 'WEIGHT',
} as const;

export type ReadingType = (typeof READING_TYPE)[keyof typeof READING_TYPE];

export const READING_TYPES = Object.values(READING_TYPE);

export interface ReadingSpec {
  unit: string;
  /** Physically possible range, used only to catch typing mistakes, never to judge health. */
  min: number;
  max: number;
  secondary?: { min: number; max: number };
  decimals: number;
}

export const READING_SPECS: Readonly<Record<ReadingType, ReadingSpec>> = {
  [READING_TYPE.BLOOD_PRESSURE]: {
    unit: 'mmHg',
    min: 50,
    max: 260,
    secondary: { min: 30, max: 160 },
    decimals: 0,
  },
  [READING_TYPE.HEART_RATE]: { unit: 'bpm', min: 25, max: 250, decimals: 0 },
  [READING_TYPE.TEMPERATURE]: { unit: '°C', min: 30, max: 45, decimals: 1 },
  [READING_TYPE.BLOOD_GLUCOSE]: { unit: 'mg/dL', min: 20, max: 700, decimals: 0 },
  [READING_TYPE.OXYGEN_SATURATION]: { unit: '%', min: 50, max: 100, decimals: 0 },
  [READING_TYPE.WEIGHT]: { unit: 'kg', min: 2, max: 300, decimals: 1 },
};

export const READING_SOURCE = {
  CAREGIVER: 'CAREGIVER',
  FAMILY: 'FAMILY',
} as const;

export type ReadingSource = (typeof READING_SOURCE)[keyof typeof READING_SOURCE];

export const WELLBEING = {
  GOOD: 'GOOD',
  OKAY: 'OKAY',
  UNWELL: 'UNWELL',
} as const;

export type Wellbeing = (typeof WELLBEING)[keyof typeof WELLBEING];

export const INCIDENT_CATEGORY = {
  FALL: 'FALL',
  MISSED_MEDICATION: 'MISSED_MEDICATION',
  HEALTH_CHANGE: 'HEALTH_CHANGE',
  INJURY: 'INJURY',
  SAFETY_CONCERN: 'SAFETY_CONCERN',
  CAREGIVER_ABSENCE: 'CAREGIVER_ABSENCE',
  OTHER: 'OTHER',
} as const;

export type IncidentCategory = (typeof INCIDENT_CATEGORY)[keyof typeof INCIDENT_CATEGORY];

export const INCIDENT_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

export type IncidentSeverity = (typeof INCIDENT_SEVERITY)[keyof typeof INCIDENT_SEVERITY];

export const INCIDENT_STATUS = {
  OPEN: 'OPEN',
  RESOLVED: 'RESOLVED',
} as const;

export type IncidentStatus = (typeof INCIDENT_STATUS)[keyof typeof INCIDENT_STATUS];

export const REPORT_RULES = {
  NOTES_MAX_LENGTH: 2000,
  MAX_READINGS_PER_REPORT: 6,
  /** A caregiver can still finish a report this long after checking out. */
  EDITABLE_AFTER_VISIT_HOURS: 12,
  INCIDENT_MIN_LENGTH: 10,
} as const;
