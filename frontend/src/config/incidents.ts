import { INCIDENT_SEVERITY, type IncidentSeverity } from '@welcheq/shared';

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
