import { useEffect } from 'react';

import { ApiError } from '@/lib/api-client';
import { signOut } from '../api/auth.api';
import { useSessionStore } from '../stores/session.store';
import { useOwnProfile } from './use-own-profile';

const UNAUTHORISED = 401;

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
  const isRejected = profile.error instanceof ApiError && profile.error.status === UNAUTHORISED;

  useEffect(() => {
    if (isRejected) void signOut();
  }, [isRejected]);

  if (status === 'loading') return { stage: 'resolving', retry };
  if (status === 'signed-out') return { stage: 'signed-out', retry };
  if (profile.isPending || isRejected) return { stage: 'resolving', retry };
  if (profile.data) return { stage: 'ready', retry };
  if (profile.data === null) return { stage: 'needs-profile', retry };

  return { stage: 'failed', errorMessage: profile.error?.message, retry };
}
