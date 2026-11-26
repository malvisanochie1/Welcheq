import { Eye, EyeOff } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { palette, touchTarget } from '@/theme';

const ICON_SIZE = 20;

export interface PasswordVisibilityToggleProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function PasswordVisibilityToggle({ isVisible, onToggle }: PasswordVisibilityToggleProps) {
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isVisible ? 'Hide password' : 'Show password'}
      onPress={onToggle}
      className="items-center justify-center"
      style={{ minWidth: touchTarget.min, minHeight: touchTarget.min }}
    >
      <Icon size={ICON_SIZE} color={palette['ink-muted']} />
    </Pressable>
  );
}
