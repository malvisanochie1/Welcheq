import type { TextSize } from '@/features/accessibility/stores/display-preferences.store';
import type { ColorMode } from '@/theme';

export const TEXT_SIZE_OPTIONS: ReadonlyArray<{ value: TextSize; label: string }> = [
  { value: 'standard', label: 'Standard' },
  { value: 'large', label: 'Large' },
  { value: 'extra-large', label: 'Extra large' },
];

export const COLOR_MODE_OPTIONS: ReadonlyArray<{
  value: ColorMode;
  label: string;
  description: string;
}> = [
  { value: 'standard', label: 'Standard', description: 'The usual Welcheq colours.' },
  {
    value: 'high-contrast',
    label: 'High contrast',
    description: 'Darker text and stronger edges for low vision.',
  },
  { value: 'night', label: 'Night', description: 'Dark and dim for night shifts.' },
];
