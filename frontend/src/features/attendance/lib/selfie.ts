import * as ImagePicker from 'expo-image-picker';

import { ApiError } from '@/lib/api-client';
import { attendanceApi } from '../api/attendance.api';

const PHOTO_QUALITY = 0.5;
const CONTENT_TYPE = 'image/jpeg';
const OFFLINE_UPLOAD_MESSAGE = 'No connection to upload the selfie.';

export class SelfieError extends Error {
  override name = 'SelfieError';
}

/** Opens the front camera; returns the local photo, or null if the caregiver cancelled. */
export async function takeSelfie(): Promise<string | null> {
  const { granted } = await ImagePicker.requestCameraPermissionsAsync();
  if (!granted) {
    throw new SelfieError('Allow camera access to take the check-in selfie.');
  }

  const result = await ImagePicker.launchCameraAsync({
    cameraType: ImagePicker.CameraType.front,
    mediaTypes: ['images'],
    quality: PHOTO_QUALITY,
    allowsEditing: false,
    exif: false,
  });

  return result.canceled ? null : (result.assets[0]?.uri ?? null);
}

/** Uploads straight to private storage through a one-time link; the API never sees the bytes. */
export async function uploadSelfie(patientId: string, localUri: string): Promise<string> {
  const { path, uploadUrl } = await attendanceApi.requestSelfieUpload(patientId);
  const photo = await (await fetch(localUri)).blob();

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': CONTENT_TYPE, 'x-upsert': 'false' },
    body: photo,
  }).catch(() => {
    throw new ApiError(0, 'NETWORK', OFFLINE_UPLOAD_MESSAGE);
  });
  if (!response.ok) {
    throw new SelfieError('The selfie did not upload. Please try again.');
  }
  return path;
}
