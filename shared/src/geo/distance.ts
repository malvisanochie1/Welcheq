const EARTH_RADIUS_METERS = 6_371_000;

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

export function distanceInMeters(from: GeoPoint, to: GeoPoint): number {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}

/**
 * Accuracy is added to the radius because a reading is a circle, not a point: a phone inside the
 * home can report a position slightly outside it.
 */
export function isWithinGeofence(
  position: GeoPoint & { accuracyMeters: number },
  center: GeoPoint,
  radiusMeters: number,
): boolean {
  return distanceInMeters(position, center) <= radiusMeters + position.accuracyMeters;
}
