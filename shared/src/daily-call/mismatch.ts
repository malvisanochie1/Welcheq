import {
  CALL_ANSWER,
  CALL_QUESTION_KIND,
  type CallAnswer,
  type CallQuestionKind,
} from '../constants/daily-call';
import { TASK_OUTCOME, type TaskOutcome } from '../constants/care-plan';

export interface AnsweredQuestion {
  kind: CallQuestionKind;
  taskId: string | null;
  answer: CallAnswer;
}

export interface CaregiverRecordSummary {
  taskOutcomes: ReadonlyMap<string, TaskOutcome>;
  hadVisitToday: boolean;
}

/**
 * A mismatch is a firm answer from the patient that contradicts the caregiver's record.
 * "Not sure" never counts, because memory can be unreliable and should not accuse anyone.
 */
export function findMismatches(
  answers: readonly AnsweredQuestion[],
  records: CaregiverRecordSummary,
): AnsweredQuestion[] {
  return answers.filter((answered) => {
    if (answered.answer === CALL_ANSWER.NOT_SURE) return false;
    const patientSaysYes = answered.answer === CALL_ANSWER.YES;

    if (answered.kind === CALL_QUESTION_KIND.CAREGIVER_VISITED) {
      return patientSaysYes !== records.hadVisitToday;
    }

    const recorded = answered.taskId ? records.taskOutcomes.get(answered.taskId) : undefined;
    if (!recorded) return false;
    return patientSaysYes !== (recorded === TASK_OUTCOME.DONE);
  });
}
