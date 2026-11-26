import { ApiError } from './api-client';

const CONTENT_TYPE = 'image/jpeg';
const OFFLINE_MESSAGE = 'No connection to upload the photo.';

export class PhotoUploadError extends Error {
  override name = 'PhotoUploadError';
}

/** Sends a local photo straight to private storage through a one-time link. */
export async function uploadPhoto(uploadUrl: string, localUri: string): Promise<void> {
  const photo = await (await fetch(localUri)).blob();
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': CONTENT_TYPE, 'x-upsert': 'false' },
    body: photo,
  }).catch(() => {
    throw new ApiError(0, 'NETWORK', OFFLINE_MESSAGE);
  });
  if (!response.ok) {
    throw new PhotoUploadError('The photo did not upload. Please try again.');
  }
}
