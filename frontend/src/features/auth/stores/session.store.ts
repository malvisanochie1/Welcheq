import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';

export type SessionStatus = 'loading' | 'signed-out' | 'signed-in';

interface SessionState {
  session: Session | null;
  status: SessionStatus;
  initialize: () => () => void;
}

const statusFor = (session: Session | null): SessionStatus =>
  session ? 'signed-in' : 'signed-out';

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  status: 'loading',

  initialize: () => {
    supabase.auth
      .getSession()
      .then(({ data }) => set({ session: data.session, status: statusFor(data.session) }))
      .catch(() => set({ session: null, status: 'signed-out' }));

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, status: statusFor(session) });
    });

    return () => data.subscription.unsubscribe();
  },
}));
