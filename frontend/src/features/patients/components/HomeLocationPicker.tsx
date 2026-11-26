import { CheckCircle2 } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Text } from '@/components/ui/Text';
import { usePalette } from '@/features/accessibility/hooks/use-palette';
import type { CapturedLocation } from '../hooks/use-home-location';

const ICON_SIZE = 18;
const COORDINATE_DECIMALS = 5;

export interface HomeLocationPickerProps {
  location: CapturedLocation | null;
  errorMessage: string | null;
  isLocating: boolean;
  canFindAddress: boolean;
  onUseCurrentPosition: () => void;
  onFindAddress: () => void;
}

function describe(location: CapturedLocation): string {
  const coordinates = `${location.latitude.toFixed(COORDINATE_DECIMALS)}, ${location.longitude.toFixed(COORDINATE_DECIMALS)}`;
  if (location.source === 'address') {
    return `Found from the address (${coordinates})`;
  }
  const accuracy = location.accuracyMeters
    ? ` · accurate to ${Math.round(location.accuracyMeters)} m`
    : '';
  return `Your current position (${coordinates})${accuracy}`;
}

export function HomeLocationPicker({
  location,
  errorMessage,
  isLocating,
  canFindAddress,
  onUseCurrentPosition,
  onFindAddress,
}: HomeLocationPickerProps) {
  const palette = usePalette();
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text variant="label">Home location</Text>
        <Text variant="caption">
          Caregivers can only check in when their phone is here. Most accurate when you are at the
          home.
        </Text>
      </View>

      {location && (
        <View className="flex-row items-center gap-2 rounded-md bg-success-soft px-4 py-3">
          <CheckCircle2 size={ICON_SIZE} color={palette.success} />
          <Text variant="label" className="flex-1 text-success">
            {describe(location)}
          </Text>
        </View>
      )}
      {errorMessage && <FormMessage message={errorMessage} />}

      <Button
        label={location ? 'Update to my current position' : "I'm at the home: use my position"}
        variant="secondary"
        onPress={onUseCurrentPosition}
        isLoading={isLocating}
      />
      {canFindAddress && (
        <Button label="Find it from the address" variant="ghost" onPress={onFindAddress} />
      )}
    </View>
  );
}
