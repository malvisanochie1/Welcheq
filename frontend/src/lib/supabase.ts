import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { publicEnv } from '@/config/env';
import { secureStorage } from './secure-storage';

export const supabase = createClient(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
