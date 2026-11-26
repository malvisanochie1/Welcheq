import { View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { WELLBEING_DETAILS } from '@/config/health-records';
import { formatDay, formatTime } from '@/lib/format-date';
import type { VisitReport } from '../api/health-records.api';

export function VisitReportSummary({ report }: { report: NonNullable<VisitReport['report']> }) {
  return (
    <View className="gap-3 rounded-lg border border-border bg-surface p-4">
      <View className="flex-row items-center gap-3">
        <Text variant="label" className="flex-1 text-base">
          How they were
        </Text>
        <Badge tone={WELLBEING_DETAILS[report.wellbeing]} />
      </View>
      {report.notes && <Text variant="body">{report.notes}</Text>}
      <Text variant="caption">
        By {report.author} · {formatDay(report.updatedAt)} at {formatTime(report.updatedAt)}
      </Text>
    </View>
  );
}
