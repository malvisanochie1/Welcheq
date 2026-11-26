import {
  INCIDENT_CATEGORY,
  INCIDENT_SEVERITY,
  type IncidentCategory,
  type IncidentSeverity,
} from '@welcheq/shared';

export const INCIDENT_CATEGORY_LABELS: Readonly<Record<IncidentCategory, string>> = {
  [INCIDENT_CATEGORY.FALL]: 'Fall',
  [INCIDENT_CATEGORY.MISSED_MEDICATION]: 'Missed medicine',
  [INCIDENT_CATEGORY.HEALTH_CHANGE]: 'Health change',
  [INCIDENT_CATEGORY.INJURY]: 'Injury',
  [INCIDENT_CATEGORY.SAFETY_CONCERN]: 'Safety concern',
  [INCIDENT_CATEGORY.CAREGIVER_ABSENCE]: 'Caregiver absent',
  [INCIDENT_CATEGORY.OTHER]: 'Something else',
};

export const INCIDENT_SEVERITY_DETAILS: Readonly<
  Record<IncidentSeverity, { label: string; containerClassName: string; textClassName: string }>
> = {
  [INCIDENT_SEVERITY.LOW]: {
    label: 'Minor',
    containerClassName: 'bg-surface-muted',
    textClassName: 'text-ink-muted',
  },
  [INCIDENT_SEVERITY.MEDIUM]: {
    label: 'Needs attention',
    containerClassName: 'bg-warning-soft',
    textClassName: 'text-warning',
  },
  [INCIDENT_SEVERITY.HIGH]: {
    label: 'Serious',
    containerClassName: 'bg-danger-soft',
    textClassName: 'text-danger',
  },
};

export const INCIDENT_TIMING_OPTIONS: ReadonlyArray<{ label: string; hoursAgo: number }> = [
  { label: 'Just now', hoursAgo: 0 },
  { label: 'About an hour ago', hoursAgo: 1 },
  { label: 'Earlier today', hoursAgo: 4 },
  { label: 'Yesterday', hoursAgo: 24 },
];
