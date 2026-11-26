import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './api-client';

const MAX_RETRIES = 2;
const STALE_TIME_MS = 30_000;

const isClientError = (error: unknown) =>
  error instanceof ApiError && error.status >= 400 && error.status < 500;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS,
      retry: (failureCount, error) => !isClientError(error) && failureCount < MAX_RETRIES,
    },
    mutations: { retry: false },
  },
});
