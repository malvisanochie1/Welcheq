import type { ShiftStatus } from '@welcheq/shared';

import { Badge } from '@/components/ui/Badge';
import { SHIFT_STATUS_DETAILS } from '@/config/attendance';

export function ShiftStatusChip({ status }: { status: ShiftStatus }) {
  return <Badge tone={SHIFT_STATUS_DETAILS[status]} />;
}
