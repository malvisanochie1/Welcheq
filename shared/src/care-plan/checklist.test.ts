import { describe, expect, it } from 'vitest';

import { CHECKLIST_STATUS, TASK_OUTCOME } from '../constants/care-plan';
import { buildChecklist, checklistStatus } from './checklist';
import { addDays, formatClockTime, localMoment, parseClockTime } from './clock';

const NOON_IN_LAGOS = new Date('2026-11-26T11:00:00Z');
const now = localMoment(NOON_IN_LAGOS, 'Africa/Lagos');
const task = (minutes: number, daysOfWeek: number[] = []) => ({
  id: `task-${minutes}`,
  minutesAfterMidnight: minutes,
  daysOfWeek,
});

describe('clock', () => {
  it('reads the local date and time in the patient time zone', () => {
    expect(now).toEqual({ date: '2026-11-26', minutes: 12 * 60, dayOfWeek: 4 });
  });

  it('moves to the next day after local midnight', () => {
    const lateNight = localMoment(new Date('2026-11-26T23:30:00Z'), 'Africa/Lagos');
    expect(lateNight.date).toBe('2026-11-27');
  });

  it('parses and formats 24-hour times', () => {
    expect(parseClockTime('08:30')).toBe(510);
    expect(parseClockTime('24:00')).toBeNull();
    expect(formatClockTime(510)).toBe('08:30');
  });

  it('adds days across month ends', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
  });
});

describe('checklistStatus', () => {
  it('marks a task due within the hour before and after its time', () => {
    expect(checklistStatus(task(12 * 60), now.date, now, undefined)).toBe(CHECKLIST_STATUS.DUE);
    expect(checklistStatus(task(12 * 60 + 45), now.date, now, undefined)).toBe(
      CHECKLIST_STATUS.DUE,
    );
  });

  it('keeps later tasks upcoming', () => {
    expect(checklistStatus(task(18 * 60), now.date, now, undefined)).toBe(
      CHECKLIST_STATUS.UPCOMING,
    );
  });

  it('marks a task missed once its grace period has passed', () => {
    expect(checklistStatus(task(8 * 60), now.date, now, undefined)).toBe(CHECKLIST_STATUS.MISSED);
  });

  it('marks every unrecorded task on a past day as missed', () => {
    expect(checklistStatus(task(23 * 60), addDays(now.date, -1), now, undefined)).toBe(
      CHECKLIST_STATUS.MISSED,
    );
  });

  it('prefers what the caregiver recorded', () => {
    expect(checklistStatus(task(8 * 60), now.date, now, TASK_OUTCOME.DONE)).toBe(
      CHECKLIST_STATUS.DONE,
    );
  });
});

describe('buildChecklist', () => {
  it('keeps only tasks scheduled for that weekday, in time order', () => {
    const thursday = 4;
    const tasks = [task(18 * 60), task(9 * 60, [thursday]), task(10 * 60, [1, 3])];
    const checklist = buildChecklist(tasks, now.date, now, new Map());
    expect(checklist.map((item) => item.task.minutesAfterMidnight)).toEqual([9 * 60, 18 * 60]);
  });
});
