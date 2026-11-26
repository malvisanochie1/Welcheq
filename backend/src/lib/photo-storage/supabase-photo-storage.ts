import { env } from '@/config/env';
import { ERROR_CODE, HttpError } from '@/lib/http-error';
import type { PhotoStorage, StoredPhoto } from './photo-storage';

const BUCKET = 'visit-photos';
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const REQUEST_TIMEOUT_MS = 10_000;

const UNAVAILABLE_MESSAGE = 'Photo storage is not available right now. Please try again.';

interface ListedObject {
  name: string;
  created_at: string;
  metadata: { size: number; mimetype: string } | null;
}

function storageUrl(path: string): string {
  return new URL(`/storage/v1/${path}`, env.SUPABASE_URL).toString();
}

async function storageRequest<T>(
  path: string,
  init: { method: string; body?: unknown },
): Promise<T> {
  const key = env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new HttpError(503, ERROR_CODE.INTERNAL, UNAVAILABLE_MESSAGE);
  }

  const response = await fetch(storageUrl(path), {
    method: init.method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new HttpError(503, ERROR_CODE.INTERNAL, UNAVAILABLE_MESSAGE, { status: response.status });
  }
  return (await response.json()) as T;
}

let bucketReady: Promise<void> | null = null;

/** Creates the private bucket on first use; an "already exists" answer counts as success. */
function ensureBucket(): Promise<void> {
  bucketReady ??= storageRequest('bucket', {
    method: 'POST',
    body: {
      id: BUCKET,
      name: BUCKET,
      public: false,
      file_size_limit: MAX_PHOTO_BYTES,
      allowed_mime_types: ALLOWED_TYPES,
    },
  })
    .then(() => undefined)
    .catch(async () => {
      await storageRequest(`bucket/${BUCKET}`, { method: 'GET' });
    })
    .catch((error) => {
      bucketReady = null;
      throw error;
    });
  return bucketReady;
}

const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/');

export const supabasePhotoStorage: PhotoStorage = {
  get isConfigured() {
    return Boolean(env.SUPABASE_SECRET_KEY);
  },

  async createUploadUrl(path) {
    await ensureBucket();
    const { url } = await storageRequest<{ url: string }>(
      `object/upload/sign/${BUCKET}/${encodePath(path)}`,
      { method: 'POST' },
    );
    return storageUrl(url.replace(/^\//, ''));
  },

  async describe(path): Promise<StoredPhoto | null> {
    const separator = path.lastIndexOf('/');
    const folder = path.slice(0, separator);
    const fileName = path.slice(separator + 1);
    const objects = await storageRequest<ListedObject[]>(`object/list/${BUCKET}`, {
      method: 'POST',
      body: { prefix: folder, search: fileName, limit: 1 },
    });
    const match = objects.find((object) => object.name === fileName);
    if (!match?.metadata) return null;
    return {
      sizeBytes: match.metadata.size,
      contentType: match.metadata.mimetype,
      createdAt: new Date(match.created_at),
    };
  },

  async createViewUrl(path, expiresInSeconds) {
    const { signedURL } = await storageRequest<{ signedURL: string }>(
      `object/sign/${BUCKET}/${encodePath(path)}`,
      { method: 'POST', body: { expiresIn: expiresInSeconds } },
    );
    return storageUrl(signedURL.replace(/^\//, ''));
  },
};

export const PHOTO_LIMITS = { MAX_PHOTO_BYTES, ALLOWED_TYPES } as const;
