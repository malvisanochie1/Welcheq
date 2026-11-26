import type { CareTaskInput, RecordTaskInput, UpdateCareTaskInput } from '@welcheq/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { carePlanApi, type Checklist } from '../api/care-plan.api';

const tasksKey = (patientId: string) => ['care-plan', patientId, 'tasks'] as const;
const checklistRoot = (patientId: string) => ['care-plan', patientId, 'checklist'] as const;
const checklistKey = (patientId: string, date: string | undefined) =>
  [...checklistRoot(patientId), date ?? 'today'] as const;

const CHECKLIST_REFRESH_MS = 60_000;

export function useCareTasks(patientId: string) {
  return useQuery({
    queryKey: tasksKey(patientId),
    queryFn: () => carePlanApi.listTasks(patientId),
  });
}

function useRefreshPlan(patientId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: tasksKey(patientId) }),
      queryClient.invalidateQueries({ queryKey: checklistRoot(patientId) }),
    ]);
}

export function useAddCareTask(patientId: string) {
  const refresh = useRefreshPlan(patientId);
  return useMutation({
    mutationFn: (input: CareTaskInput) => carePlanApi.addTask(patientId, input),
    onSuccess: refresh,
  });
}

export function useApplyTemplate(patientId: string) {
  const refresh = useRefreshPlan(patientId);
  return useMutation({
    mutationFn: (templateId: string) => carePlanApi.applyTemplate(patientId, templateId),
    onSuccess: refresh,
  });
}

export function useUpdateCareTask(patientId: string, taskId: string) {
  const refresh = useRefreshPlan(patientId);
  return useMutation({
    mutationFn: (input: UpdateCareTaskInput) => carePlanApi.updateTask(patientId, taskId, input),
    onSuccess: refresh,
  });
}

export function useRemoveCareTask(patientId: string) {
  const refresh = useRefreshPlan(patientId);
  return useMutation({
    mutationFn: (taskId: string) => carePlanApi.removeTask(patientId, taskId),
    onSuccess: refresh,
  });
}

/** Refreshes every minute so tasks move from "later" to "due" to "missed" on their own. */
export function useChecklist(patientId: string, date?: string) {
  return useQuery({
    queryKey: checklistKey(patientId, date),
    queryFn: () => carePlanApi.checklist(patientId, date),
    refetchInterval: CHECKLIST_REFRESH_MS,
  });
}

export function useRecordTask(patientId: string, date?: string) {
  const queryClient = useQueryClient();
  const key = checklistKey(patientId, date);

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: RecordTaskInput }) =>
      carePlanApi.recordTask(patientId, taskId, input),
    onMutate: async ({ taskId, input }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Checklist>(key);
      if (previous) {
        queryClient.setQueryData<Checklist>(key, {
          ...previous,
          items: previous.items.map((item) =>
            item.task.id === taskId ? { ...item, status: input.outcome } : item,
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSuccess: (checklist) => {
      queryClient.setQueryData(key, checklist);
      return queryClient.invalidateQueries({ queryKey: checklistRoot(patientId) });
    },
  });
}
