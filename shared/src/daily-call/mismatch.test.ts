import { describe, expect, it } from 'vitest';

import { CALL_ANSWER, CALL_QUESTION_KIND } from '../constants/daily-call';
import { findMismatches } from './mismatch';

const records = {
  taskOutcomes: new Map([
    ['medicine', 'DONE' as const],
    ['lunch', 'NOT_DONE' as const],
  ]),
  hadVisitToday: true,
};

const task = (taskId: string, answer: keyof typeof CALL_ANSWER) => ({
  kind: CALL_QUESTION_KIND.TASK,
  taskId,
  answer: CALL_ANSWER[answer],
});

describe('findMismatches', () => {
  it('flags a task the caregiver marked done but the patient says did not happen', () => {
    expect(findMismatches([task('medicine', 'NO')], records)).toHaveLength(1);
  });

  it('accepts answers that agree with the record', () => {
    expect(findMismatches([task('medicine', 'YES'), task('lunch', 'NO')], records)).toEqual([]);
  });

  it('never flags "not sure"', () => {
    expect(findMismatches([task('medicine', 'NOT_SURE')], records)).toEqual([]);
  });

  it('ignores tasks the caregiver has not recorded', () => {
    expect(findMismatches([task('walk', 'NO')], records)).toEqual([]);
  });

  it('flags a claimed visit the patient says did not happen', () => {
    const answers = [
      { kind: CALL_QUESTION_KIND.CAREGIVER_VISITED, taskId: null, answer: CALL_ANSWER.NO },
    ];
    expect(findMismatches(answers, records)).toHaveLength(1);
    expect(findMismatches(answers, { ...records, hadVisitToday: false })).toEqual([]);
  });
});
