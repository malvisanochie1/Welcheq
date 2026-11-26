import * as ImagePicker from 'expo-image-picker';

import { PhotoUploadError, uploadPhoto } from '@/lib/photo-upload';
import { attendanceApi } from '../api/attendance.api';

const PHOTO_QUALITY = 0.5;

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
  try {
    await uploadPhoto(uploadUrl, localUri);
  } catch (error) {
    if (error instanceof PhotoUploadError) {
      throw new SelfieError('The selfie did not upload. Please try again.');
    }
    throw error;
  }
  return path;
}
