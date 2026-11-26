import { describe, expect, it } from 'vitest';

import { distanceInMeters, isWithinGeofence } from './distance';

const LAGOS_HOME = { latitude: 6.5244, longitude: 3.3792 };

describe('distanceInMeters', () => {
  it('is zero for the same point', () => {
    expect(distanceInMeters(LAGOS_HOME, LAGOS_HOME)).toBe(0);
  });

  it('measures roughly 111 km per degree of latitude', () => {
    const oneDegreeNorth = { ...LAGOS_HOME, latitude: LAGOS_HOME.latitude + 1 };
    expect(distanceInMeters(LAGOS_HOME, oneDegreeNorth)).toBeCloseTo(111_195, -2);
  });
});

describe('isWithinGeofence', () => {
  const nearby = { latitude: 6.5253, longitude: 3.3792, accuracyMeters: 10 };

  it('accepts a reading inside the radius', () => {
    expect(isWithinGeofence(nearby, LAGOS_HOME, 150)).toBe(true);
  });

  it('rejects a reading outside the radius', () => {
    expect(isWithinGeofence(nearby, LAGOS_HOME, 50)).toBe(false);
  });

  it('allows for the reported accuracy of the reading', () => {
    expect(isWithinGeofence({ ...nearby, accuracyMeters: 60 }, LAGOS_HOME, 50)).toBe(true);
  });
});
