import { CALL_ANSWER, CALL_OUTCOME } from '@welcheq/shared';
import { AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { usePalette } from '@/features/accessibility/hooks/use-palette';
import type { RecordedCall } from '../api/daily-call.api';

const ICON_SIZE = 28;

export interface CallResultProps {
  call: RecordedCall;
  patientFirstName: string;
  onDone: () => void;
}

export function CallResult({ call, patientFirstName, onDone }: CallResultProps) {
  const palette = usePalette();
  const mismatches = call.answers.filter((answer) => answer.isMismatch);
  const isReached = call.outcome === CALL_OUTCOME.REACHED;
  const isClear = isReached && mismatches.length === 0;
  const Icon = isClear || !isReached ? CheckCircle2 : AlertTriangle;

  return (
    <View className="gap-6">
      <View className="items-center gap-3 rounded-lg bg-surface p-6">
        <Icon size={ICON_SIZE} color={isClear || !isReached ? palette.success : palette.warning} />
        <Text variant="heading" className="text-center" accessibilityLiveRegion="polite">
          {!isReached
            ? `Noted. Try ${patientFirstName} again later.`
            : isClear
              ? `What ${patientFirstName} said matches the caregiver's records.`
              : `${mismatches.length} answer${mismatches.length === 1 ? '' : 's'} did not match the caregiver's records`}
        </Text>
      </View>

      {mismatches.length > 0 && (
        <View className="gap-2 rounded-lg border border-warning bg-warning-soft p-4">
          {mismatches.map((mismatch) => (
            <Text key={mismatch.title} variant="body">
              • {mismatch.title}: {patientFirstName} said{' '}
              {mismatch.answer === CALL_ANSWER.YES ? 'yes' : 'no'}
            </Text>
          ))}
          <Text variant="caption">
            Memory can be unreliable, so talk it through with the caregiver before drawing
            conclusions.
          </Text>
        </View>
      )}

      <Button label="Done" onPress={onDone} />
    </View>
  );
}
