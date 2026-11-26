import { publicEnv } from '@/config/env';
import { supabase } from './supabase';

/** Long enough to cover the free API host waking from sleep. */
const REQUEST_TIMEOUT_MS = 30_000;
const NO_CONTENT = 204;

const NETWORK_ERROR_MESSAGE = 'We could not reach Welcheq. Check your connection and try again.';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

async function authorizationHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest<T>(
  path: string,
  { method = 'GET', body }: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${publicEnv.apiUrl}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(await authorizationHeader()),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (response.status === NO_CONTENT) {
      return undefined as T;
    }

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(
        response.status,
        payload?.error?.code ?? 'UNKNOWN',
        payload?.error?.message ?? 'Something went wrong. Please try again.',
      );
    }

    return (payload as { data: T } | null)?.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, 'NETWORK', NETWORK_ERROR_MESSAGE);
  } finally {
    clearTimeout(timeout);
  }
}
