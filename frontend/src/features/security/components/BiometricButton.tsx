import { Fingerprint } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { usePalette } from '@/features/accessibility/hooks/use-palette';
import { touchTarget } from '@/theme';

const ICON_SIZE = 22;

export interface BiometricButtonProps {
  onPress: () => void;
}

export function BiometricButton({ onPress }: BiometricButtonProps) {
  const palette = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Sign in with fingerprint"
      onPress={onPress}
      className="items-center justify-center"
      style={{ minWidth: touchTarget.min, minHeight: touchTarget.min }}
    >
      <Fingerprint size={ICON_SIZE} color={palette.primary} />
    </Pressable>
  );
}
