import * as ImagePicker from 'expo-image-picker';

import { DOCUMENT_PHOTO_QUALITY } from '@/config/health-profile';
import { uploadPhoto } from '@/lib/photo-upload';
import { healthProfileApi } from '../api/health-profile.api';

export type DocumentSource = 'camera' | 'library';

export class DocumentPhotoError extends Error {
  override name = 'DocumentPhotoError';
}

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: DOCUMENT_PHOTO_QUALITY,
  allowsEditing: false,
  exif: false,
};

/** Returns the chosen photo, or null if the person cancelled. */
export async function pickDocumentPhoto(source: DocumentSource): Promise<string | null> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new DocumentPhotoError(
      source === 'camera'
        ? 'Allow camera access to photograph the document.'
        : 'Allow photo access to choose the document.',
    );
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
      : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
  return result.canceled ? null : (result.assets[0]?.uri ?? null);
}

export async function saveDocumentPhoto(patientId: string, title: string, localUri: string) {
  const { path, uploadUrl } = await healthProfileApi.requestDocumentUpload(patientId);
  await uploadPhoto(uploadUrl, localUri);
  return healthProfileApi.addDocument(patientId, title, path);
}
