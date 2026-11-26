import {
  CARE_PLAN_RULES,
  CHECKLIST_STATUS,
  type ChecklistStatus,
  type TaskOutcome,
} from '../constants/care-plan';
import { dayOfWeekFor, type LocalMoment } from './clock';

export interface ScheduledTask {
  id: string;
  minutesAfterMidnight: number;
  daysOfWeek: readonly number[];
}

export function isScheduledOn(task: ScheduledTask, isoDate: string): boolean {
  return task.daysOfWeek.length === 0 || task.daysOfWeek.includes(dayOfWeekFor(isoDate));
}

export function checklistStatus(
  task: ScheduledTask,
  checklistDate: string,
  now: LocalMoment,
  recordedOutcome: TaskOutcome | undefined,
): ChecklistStatus {
  if (recordedOutcome) {
    return recordedOutcome;
  }
  if (checklistDate < now.date) {
    return CHECKLIST_STATUS.MISSED;
  }
  if (checklistDate > now.date) {
    return CHECKLIST_STATUS.UPCOMING;
  }

  const minutesUntilDue = task.minutesAfterMidnight - now.minutes;
  if (minutesUntilDue > CARE_PLAN_RULES.DUE_WINDOW_MINUTES) {
    return CHECKLIST_STATUS.UPCOMING;
  }
  if (-minutesUntilDue > CARE_PLAN_RULES.GRACE_MINUTES) {
    return CHECKLIST_STATUS.MISSED;
  }
  return CHECKLIST_STATUS.DUE;
}

export function buildChecklist<TTask extends ScheduledTask>(
  tasks: readonly TTask[],
  checklistDate: string,
  now: LocalMoment,
  outcomes: ReadonlyMap<string, TaskOutcome>,
) {
  return tasks
    .filter((task) => isScheduledOn(task, checklistDate))
    .sort((first, second) => first.minutesAfterMidnight - second.minutesAfterMidnight)
    .map((task) => ({
      task,
      status: checklistStatus(task, checklistDate, now, outcomes.get(task.id)),
    }));
}
