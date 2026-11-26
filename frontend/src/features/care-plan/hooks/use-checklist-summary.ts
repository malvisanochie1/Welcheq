import { CHECKLIST_STATUS } from '@welcheq/shared';

import { useChecklist } from './use-care-plan';

export function useChecklistSummary(patientId: string) {
  const checklist = useChecklist(patientId);
  const items = checklist.data?.items ?? [];
  const count = (status: string) => items.filter((item) => item.status === status).length;

  return {
    isLoading: checklist.isPending,
    total: items.length,
    done: count(CHECKLIST_STATUS.DONE),
    missed: count(CHECKLIST_STATUS.MISSED) + count(CHECKLIST_STATUS.NOT_DONE),
    due: count(CHECKLIST_STATUS.DUE),
  };
}
