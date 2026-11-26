import { READING_SPECS } from '@welcheq/shared';
import { X } from 'lucide-react-native';
import { View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { READING_DETAILS } from '@/config/health-records';
import { usePalette } from '@/features/accessibility/hooks/use-palette';
import { cleanNumberInput, type ReadingDraft } from '../lib/reading-draft';

const ICON_SIZE = 18;

export interface ReadingFieldsProps {
  draft: ReadingDraft;
  errorMessage?: string;
  onChange: (draft: ReadingDraft) => void;
  onRemove?: () => void;
}

export function ReadingFields({ draft, errorMessage, onChange, onRemove }: ReadingFieldsProps) {
  const palette = usePalette();
  const spec = READING_SPECS[draft.type];
  const details = READING_DETAILS[draft.type];
  const keyboardType = spec.decimals > 0 ? 'decimal-pad' : 'number-pad';
  const clean = (text: string) => cleanNumberInput(text, spec.decimals);

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text variant="label">
          {details.label} <Text variant="caption">({spec.unit})</Text>
        </Text>
        {onRemove && (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Remove ${details.label.toLowerCase()}`}
            onPress={onRemove}
            className="h-12 w-12 items-center justify-center"
          >
            <X size={ICON_SIZE} color={palette['ink-muted']} />
          </PressableScale>
        )}
      </View>
      <View className="flex-row items-start gap-3">
        <TextField
          label={spec.secondary ? 'Top number' : `${details.label} in ${spec.unit}`}
          value={draft.value}
          onChangeText={(text) => onChange({ ...draft, value: clean(text) })}
          placeholder={details.placeholder}
          keyboardType={keyboardType}
          className="flex-1"
        />
        {spec.secondary && (
          <TextField
            label="Bottom number"
            value={draft.secondaryValue}
            onChangeText={(text) => onChange({ ...draft, secondaryValue: clean(text) })}
            placeholder={details.secondaryPlaceholder}
            keyboardType={keyboardType}
            className="flex-1"
          />
        )}
      </View>
      {errorMessage && (
        <Text variant="caption" className="text-danger">
          {errorMessage}
        </Text>
      )}
    </View>
  );
}
