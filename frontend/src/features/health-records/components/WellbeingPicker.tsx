import { WELLBEING, type Wellbeing } from '@welcheq/shared';
import { View } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { WELLBEING_DETAILS } from '@/config/health-records';

export interface WellbeingPickerProps {
  patientFirstName: string;
  value: Wellbeing | null;
  onChange: (wellbeing: Wellbeing) => void;
}

export function WellbeingPicker({ patientFirstName, value, onChange }: WellbeingPickerProps) {
  return (
    <View className="gap-3">
      <Text variant="label">How was {patientFirstName} today?</Text>
      <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
        {Object.values(WELLBEING).map((wellbeing) => (
          <Chip
            key={wellbeing}
            role="radio"
            label={WELLBEING_DETAILS[wellbeing].label}
            isSelected={value === wellbeing}
            onPress={() => onChange(wellbeing)}
          />
        ))}
      </View>
    </View>
  );
}
