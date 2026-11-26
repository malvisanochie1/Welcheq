import type { ChecklistStatus } from '@welcheq/shared';

import { Badge } from '@/components/ui/Badge';
import { STATUS_DETAILS } from '@/config/care-plan';

export function StatusChip({ status }: { status: ChecklistStatus }) {
  return <Badge tone={STATUS_DETAILS[status]} />;
}
