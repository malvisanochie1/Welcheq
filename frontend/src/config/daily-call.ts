import { CALL_ANSWER, type CallAnswer } from '@welcheq/shared';

export const CALL_ANSWER_OPTIONS: ReadonlyArray<{ answer: CallAnswer; label: string }> = [
  { answer: CALL_ANSWER.YES, label: 'Yes' },
  { answer: CALL_ANSWER.NO, label: 'No' },
  { answer: CALL_ANSWER.NOT_SURE, label: 'Not sure' },
];
