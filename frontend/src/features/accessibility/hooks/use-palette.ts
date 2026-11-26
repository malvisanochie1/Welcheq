import { palettes, type Palette } from '@/theme';
import { useDisplayPreferences } from '../stores/display-preferences.store';

/** The colours in use right now, for the few places that need a colour value, such as icons. */
export function usePalette(): Palette {
  return palettes[useDisplayPreferences((state) => state.colorMode)];
}
