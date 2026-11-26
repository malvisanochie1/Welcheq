import { ApiError } from '@/lib/api-client';
import { useSessionStore } from '../stores/session.store';
import { useOwnProfile } from './use-own-profile';

export type AccessStage = 'resolving' | 'signed-out' | 'needs-profile' | 'ready' | 'failed';

export interface AccessState {
  stage: AccessStage;
  errorMessage?: string;
  retry: () => void;
}

export function useAccessStage(): AccessState {
  const status = useSessionStore((state) => state.status);
  const profile = useOwnProfile();
  const retry = () => void profile.refetch();

  if (status === 'loading') return { stage: 'resolving', retry };
  if (status === 'signed-out') return { stage: 'signed-out', retry };
  if (profile.isPending) return { stage: 'resolving', retry };
  if (profile.data) return { stage: 'ready', retry };

  if (profile.error instanceof ApiError && profile.error.status === 404) {
    return { stage: 'needs-profile', retry };
  }

  return { stage: 'failed', errorMessage: profile.error?.message, retry };
}
