import type { Wellbeing } from '@welcheq/shared';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { WELLBEING_DETAILS } from '@/config/health-records';

export interface VisitReportLinkProps {
  patientId: string;
  visitId: string;
  wellbeing: Wellbeing | null;
}

export function VisitReportLink({ patientId, visitId, wellbeing }: VisitReportLinkProps) {
  return (
    <View className="flex-row items-center gap-2">
      <Button
        label={wellbeing ? 'Visit report' : 'No report yet'}
        variant="ghost"
        onPress={() =>
          router.push({
            pathname: '/patients/[patientId]/visit-report',
            params: { patientId, visitId },
          })
        }
      />
      {wellbeing && <Badge tone={WELLBEING_DETAILS[wellbeing]} />}
    </View>
  );
}
