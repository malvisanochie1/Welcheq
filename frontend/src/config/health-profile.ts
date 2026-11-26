import { ALLERGY_SEVERITY, type AllergySeverity } from '@welcheq/shared';

import type { BadgeTone } from '@/components/ui/Badge';

export const ALLERGY_SEVERITY_DETAILS: Readonly<Record<AllergySeverity, BadgeTone>> = {
  [ALLERGY_SEVERITY.MILD]: {
    label: 'Mild',
    containerClassName: 'bg-surface-muted',
    textClassName: 'text-ink-muted',
  },
  [ALLERGY_SEVERITY.MODERATE]: {
    label: 'Moderate',
    containerClassName: 'bg-warning-soft',
    textClassName: 'text-warning',
  },
  [ALLERGY_SEVERITY.SEVERE]: {
    label: 'Severe',
    containerClassName: 'bg-danger-soft',
    textClassName: 'text-danger',
  },
};

export const DOCUMENT_PHOTO_QUALITY = 0.6;
