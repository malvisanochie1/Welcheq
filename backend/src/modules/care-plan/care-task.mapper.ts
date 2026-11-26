import { formatClockTime } from '@welcheq/shared';

import type { Prisma } from '@/generated/prisma/client';

export const CARE_TASK_FIELDS = {
  id: true,
  title: true,
  category: true,
  instructions: true,
  minutesAfterMidnight: true,
  daysOfWeek: true,
} as const satisfies Prisma.CareTaskSelect;

export type CareTaskRecord = Prisma.CareTaskGetPayload<{ select: typeof CARE_TASK_FIELDS }>;

export function toCareTaskResponse(task: CareTaskRecord) {
  return {
    id: task.id,
    title: task.title,
    category: task.category,
    instructions: task.instructions,
    time: formatClockTime(task.minutesAfterMidnight),
    daysOfWeek: task.daysOfWeek,
  };
}
