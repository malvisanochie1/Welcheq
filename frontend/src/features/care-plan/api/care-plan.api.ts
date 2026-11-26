import type {
  CareTaskCategory,
  CareTaskInput,
  ChecklistStatus,
  RecordTaskInput,
  TaskOutcome,
  UpdateCareTaskInput,
} from '@welcheq/shared';

import { apiRequest } from '@/lib/api-client';

export interface CareTask {
  id: string;
  title: string;
  category: CareTaskCategory;
  instructions: string | null;
  time: string;
  daysOfWeek: number[];
}

export interface ChecklistItem {
  task: CareTask;
  status: ChecklistStatus;
  record: {
    outcome: TaskOutcome;
    note: string | null;
    recordedBy: string;
    recordedAt: string;
  } | null;
}

export interface Checklist {
  date: string;
  today: string;
  timeZone: string;
  canRecord: boolean;
  items: ChecklistItem[];
}

const basePath = (patientId: string) => `/v1/patients/${encodeURIComponent(patientId)}`;

export const carePlanApi = {
  listTasks: (patientId: string) => apiRequest<CareTask[]>(`${basePath(patientId)}/care-tasks`),
  addTask: (patientId: string, input: CareTaskInput) =>
    apiRequest<CareTask>(`${basePath(patientId)}/care-tasks`, { method: 'POST', body: input }),
  applyTemplate: (patientId: string, templateId: string) =>
    apiRequest<CareTask[]>(`${basePath(patientId)}/care-tasks/from-template`, {
      method: 'POST',
      body: { templateId },
    }),
  updateTask: (patientId: string, taskId: string, input: UpdateCareTaskInput) =>
    apiRequest<CareTask>(`${basePath(patientId)}/care-tasks/${encodeURIComponent(taskId)}`, {
      method: 'PATCH',
      body: input,
    }),
  removeTask: (patientId: string, taskId: string) =>
    apiRequest<void>(`${basePath(patientId)}/care-tasks/${encodeURIComponent(taskId)}`, {
      method: 'DELETE',
    }),
  checklist: (patientId: string, date?: string) =>
    apiRequest<Checklist>(
      `${basePath(patientId)}/checklist${date ? `?date=${encodeURIComponent(date)}` : ''}`,
    ),
  recordTask: (patientId: string, taskId: string, input: RecordTaskInput) =>
    apiRequest<Checklist>(`${basePath(patientId)}/checklist/${encodeURIComponent(taskId)}`, {
      method: 'PUT',
      body: input,
    }),
};
