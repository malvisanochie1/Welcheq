import { AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { ATTENDANCE_FLAG_LABELS, SURPRISE_CHECK_OUTCOME_LABELS } from '@/config/attendance';
import { palette } from '@/theme';
import type { Visit } from '../api/attendance.api';

const ICON_SIZE = 14;

export function VisitEvidence({ visit }: { visit: Visit }) {
  const surprise = visit.surpriseCheck && SURPRISE_CHECK_OUTCOME_LABELS[visit.surpriseCheck.status];
  const lines = [
    ...(visit.homeCodeVerified ? [{ label: 'Home code confirmed', isWarning: false }] : []),
    ...(surprise ? [surprise] : []),
    ...visit.flags.map((flag) => ({ label: ATTENDANCE_FLAG_LABELS[flag], isWarning: true })),
  ];

  if (lines.length === 0) {
    return null;
  }

  return (
    <View className="gap-1">
      {lines.map(({ label, isWarning }) => {
        const Icon = isWarning ? AlertTriangle : CheckCircle2;
        return (
          <View key={label} className="flex-row items-center gap-2">
            <Icon size={ICON_SIZE} color={isWarning ? palette.warning : palette.success} />
            <Text variant="caption" className={isWarning ? 'text-warning' : 'text-success'}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
