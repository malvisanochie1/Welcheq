import {
  READING_SOURCE,
  READING_TYPE,
  WELLBEING,
  type ReadingSource,
  type ReadingType,
  type Wellbeing,
} from '@welcheq/shared';

export const READING_HISTORY_DAYS = 30;

export const READING_DETAILS: Readonly<
  Record<ReadingType, { label: string; placeholder: string; secondaryPlaceholder?: string }>
> = {
  [READING_TYPE.BLOOD_PRESSURE]: {
    label: 'Blood pressure',
    placeholder: '130',
    secondaryPlaceholder: '85',
  },
  [READING_TYPE.HEART_RATE]: { label: 'Pulse', placeholder: '72' },
  [READING_TYPE.TEMPERATURE]: { label: 'Temperature', placeholder: '36.8' },
  [READING_TYPE.BLOOD_GLUCOSE]: { label: 'Blood sugar', placeholder: '110' },
  [READING_TYPE.OXYGEN_SATURATION]: { label: 'Oxygen', placeholder: '97' },
  [READING_TYPE.WEIGHT]: { label: 'Weight', placeholder: '64.5' },
};

export const READING_SOURCE_LABELS: Readonly<Record<ReadingSource, string>> = {
  [READING_SOURCE.CAREGIVER]: 'Caregiver',
  [READING_SOURCE.FAMILY]: 'Family',
};

export const WELLBEING_DETAILS: Readonly<
  Record<Wellbeing, { label: string; containerClassName: string; textClassName: string }>
> = {
  [WELLBEING.GOOD]: {
    label: 'Good',
    containerClassName: 'bg-success-soft',
    textClassName: 'text-success',
  },
  [WELLBEING.OKAY]: {
    label: 'Okay',
    containerClassName: 'bg-warning-soft',
    textClassName: 'text-warning',
  },
  [WELLBEING.UNWELL]: {
    label: 'Unwell',
    containerClassName: 'bg-danger-soft',
    textClassName: 'text-danger',
  },
};
