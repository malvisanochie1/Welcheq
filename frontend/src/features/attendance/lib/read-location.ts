import type { LocationReading } from '@welcheq/shared';
import * as Location from 'expo-location';

/** Readings without an accuracy are treated as the least precise reading the API accepts. */
const UNKNOWN_ACCURACY_METERS = 5_000;

const PERMISSION_MESSAGE = 'Allow location access to check in. Welcheq only reads it when you tap.';
const UNAVAILABLE_MESSAGE = 'We could not get your location. Move near a window and try again.';

export class LocationUnavailableError extends Error {
  override name = 'LocationUnavailableError';
}

/** Reads one precise position on demand; Welcheq never tracks location in the background. */
export async function readCurrentLocation(): Promise<LocationReading> {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) {
    throw new LocationUnavailableError(PERMISSION_MESSAGE);
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Highest,
  }).catch(() => {
    throw new LocationUnavailableError(UNAVAILABLE_MESSAGE);
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracyMeters: position.coords.accuracy ?? UNKNOWN_ACCURACY_METERS,
    isMocked: position.mocked ?? false,
  };
}
