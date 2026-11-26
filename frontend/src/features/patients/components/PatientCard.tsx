import { ChevronRight, MapPin } from 'lucide-react-native';
import { View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { palette } from '@/theme';
import type { Patient } from '../api/patients.api';
import { ageFromDateOfBirth } from '../lib/age';

const ICON_SIZE = 16;

export interface PatientCardProps {
  patient: Patient;
  onPress: () => void;
}

export function PatientCard({ patient, onPress }: PatientCardProps) {
  const age = ageFromDateOfBirth(patient.dateOfBirth);
  const initials = patient.fullName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${patient.fullName}${age === null ? '' : `, ${age} years old`}`}
      accessibilityHint="Opens their care details"
      onPress={onPress}
      className="flex-row items-center gap-4 rounded-lg border border-border bg-surface p-4"
    >
      <View className="h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft">
        <Text variant="heading" className="text-primary">
          {initials}
        </Text>
      </View>
      <View className="flex-1 gap-1">
        <Text variant="heading" className="text-base">
          {patient.fullName}
          {age !== null && <Text variant="caption"> · {age}</Text>}
        </Text>
        <View className="flex-row items-center gap-1">
          <MapPin size={ICON_SIZE} color={palette['ink-subtle']} />
          <Text variant="caption" numberOfLines={1} className="flex-1">
            {patient.homeAddress}
          </Text>
        </View>
      </View>
      <ChevronRight size={ICON_SIZE + 4} color={palette['ink-subtle']} />
    </PressableScale>
  );
}
