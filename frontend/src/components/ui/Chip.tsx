import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { cn } from '@/lib/cn';

export interface ChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  role?: 'checkbox' | 'radio';
}

export function Chip({ label, isSelected, onPress, role = 'checkbox' }: ChipProps) {
  return (
    <PressableScale
      accessibilityRole={role}
      accessibilityState={role === 'radio' ? { selected: isSelected } : { checked: isSelected }}
      onPress={onPress}
      className={cn(
        'min-h-12 justify-center rounded-full border-2 px-4',
        isSelected ? 'border-primary bg-primary-soft' : 'border-border bg-surface',
      )}
    >
      <Text variant="label" className={isSelected ? 'text-primary' : undefined}>
        {label}
      </Text>
    </PressableScale>
  );
}
