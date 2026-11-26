import {
  CARE_TASK_CATEGORY,
  CHECKLIST_STATUS,
  type CareTaskCategory,
  type ChecklistStatus,
} from '@welcheq/shared';
import {
  Activity,
  Bath,
  CircleDot,
  Footprints,
  Pill,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';

export const CATEGORY_DETAILS: Readonly<
  Record<CareTaskCategory, { label: string; icon: LucideIcon }>
> = {
  [CARE_TASK_CATEGORY.MEDICATION]: { label: 'Medicine', icon: Pill },
  [CARE_TASK_CATEGORY.VITALS]: { label: 'Health check', icon: Activity },
  [CARE_TASK_CATEGORY.PERSONAL_CARE]: { label: 'Personal care', icon: Bath },
  [CARE_TASK_CATEGORY.MEAL]: { label: 'Food and water', icon: UtensilsCrossed },
  [CARE_TASK_CATEGORY.MOBILITY]: { label: 'Movement', icon: Footprints },
  [CARE_TASK_CATEGORY.OTHER]: { label: 'Other', icon: CircleDot },
};

export const STATUS_DETAILS: Readonly<
  Record<ChecklistStatus, { label: string; containerClassName: string; textClassName: string }>
> = {
  [CHECKLIST_STATUS.DONE]: {
    label: 'Done',
    containerClassName: 'bg-success-soft',
    textClassName: 'text-success',
  },
  [CHECKLIST_STATUS.NOT_DONE]: {
    label: 'Not done',
    containerClassName: 'bg-warning-soft',
    textClassName: 'text-warning',
  },
  [CHECKLIST_STATUS.MISSED]: {
    label: 'Missed',
    containerClassName: 'bg-danger-soft',
    textClassName: 'text-danger',
  },
  [CHECKLIST_STATUS.DUE]: {
    label: 'Due now',
    containerClassName: 'bg-accent-soft',
    textClassName: 'text-accent',
  },
  [CHECKLIST_STATUS.UPCOMING]: {
    label: 'Later',
    containerClassName: 'bg-surface-muted',
    textClassName: 'text-ink-muted',
  },
};

export const WEEKDAY_SHORT_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
