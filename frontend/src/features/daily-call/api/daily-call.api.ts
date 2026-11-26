import type {
  CallAnswer,
  CallOutcome,
  CallQuestionKind,
  CareTaskCategory,
  RecordDailyCallInput,
} from '@welcheq/shared';

import { apiRequest } from '@/lib/api-client';

export interface CallQuestion {
  kind: CallQuestionKind;
  taskId: string | null;
  title: string;
  category: CareTaskCategory | null;
}

export interface RecordedCall {
  id: string;
  date: string;
  outcome: CallOutcome;
  answers: Array<{
    kind: CallQuestionKind;
    taskId: string | null;
    answer: CallAnswer;
    title: string;
    isMismatch: boolean;
  }>;
  mismatchCount: number;
  note: string | null;
  calledBy: string;
  calledAt: string;
}

export interface DailyCallPlan {
  date: string;
  patientFirstName: string;
  phone: string | null;
  questions: CallQuestion[];
  todaysCalls: RecordedCall[];
}

const basePath = (patientId: string) => `/v1/patients/${encodeURIComponent(patientId)}`;

export const dailyCallApi = {
  plan: (patientId: string) => apiRequest<DailyCallPlan>(`${basePath(patientId)}/daily-call`),
  record: (patientId: string, input: RecordDailyCallInput) =>
    apiRequest<RecordedCall>(`${basePath(patientId)}/daily-call`, { method: 'POST', body: input }),
  updatePhone: (patientId: string, phone: string | null) =>
    apiRequest<void>(`${basePath(patientId)}/contact`, { method: 'PUT', body: { phone } }),
};
