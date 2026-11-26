import { View } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { SwitchRow } from '@/components/ui/SwitchRow';
import { Text } from '@/components/ui/Text';
import { COLOR_MODE_OPTIONS, TEXT_SIZE_OPTIONS } from '@/config/display-preferences';
import { useDisplayPreferences } from '../stores/display-preferences.store';

export function DisplaySettings() {
  const preferences = useDisplayPreferences();
  const activeColorMode = COLOR_MODE_OPTIONS.find(
    (option) => option.value === preferences.colorMode,
  );

  return (
    <View className="gap-6">
      <View className="gap-3">
        <Text variant="label">Text size</Text>
        <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
          {TEXT_SIZE_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              role="radio"
              label={option.label}
              isSelected={preferences.textSize === option.value}
              onPress={() => preferences.setTextSize(option.value)}
            />
          ))}
        </View>
      </View>

      <View className="gap-3">
        <Text variant="label">Colours</Text>
        <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
          {COLOR_MODE_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              role="radio"
              label={option.label}
              isSelected={preferences.colorMode === option.value}
              onPress={() => preferences.setColorMode(option.value)}
            />
          ))}
        </View>
        {activeColorMode && <Text variant="caption">{activeColorMode.description}</Text>}
      </View>

      <SwitchRow
        title="Easier reading"
        description="More space between letters and lines, which helps many people with dyslexia."
        value={preferences.hasReadingAid}
        onValueChange={preferences.setReadingAid}
      />
    </View>
  );
}
