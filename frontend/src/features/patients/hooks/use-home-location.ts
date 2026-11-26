import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

export interface CapturedLocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  source: 'device' | 'address';
}

const PERMISSION_MESSAGE = 'Allow location access so Welcheq can record where the home is.';
const NOT_FOUND_MESSAGE = 'We could not find that address. Try adding the area and city.';
const UNAVAILABLE_MESSAGE = 'We could not get a location. Move near a window and try again.';

async function ensurePermission(): Promise<void> {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) {
    throw new Error(PERMISSION_MESSAGE);
  }
}

export function useHomeLocation() {
  const [location, setLocation] = useState<CapturedLocation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const run = useCallback(async (capture: () => Promise<CapturedLocation>) => {
    setErrorMessage(null);
    setIsLocating(true);
    try {
      setLocation(await capture());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : UNAVAILABLE_MESSAGE);
    } finally {
      setIsLocating(false);
    }
  }, []);

  const captureCurrentPosition = useCallback(
    () =>
      run(async () => {
        await ensurePermission();
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        }).catch(() => {
          throw new Error(UNAVAILABLE_MESSAGE);
        });
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
          source: 'device',
        };
      }),
    [run],
  );

  const findAddress = useCallback(
    (address: string) =>
      run(async () => {
        await ensurePermission();
        const [match] = await Location.geocodeAsync(address).catch(() => []);
        if (!match) {
          throw new Error(NOT_FOUND_MESSAGE);
        }
        return {
          latitude: match.latitude,
          longitude: match.longitude,
          accuracyMeters: null,
          source: 'address',
        };
      }),
    [run],
  );

  return {
    location,
    errorMessage,
    isLocating,
    canFindAddress: Platform.OS !== 'web',
    captureCurrentPosition,
    findAddress,
  };
}
