import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api-client';

export interface ServerCapabilities {
  selfie: boolean;
}

const CAPABILITIES_STALE_MS = 10 * 60_000;

export function useCapabilities() {
  return useQuery({
    queryKey: ['capabilities'],
    queryFn: () => apiRequest<ServerCapabilities>('/v1/capabilities'),
    staleTime: CAPABILITIES_STALE_MS,
  });
}
