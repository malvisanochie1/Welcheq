import { Router } from 'express';

import { supabasePhotoStorage } from '@/lib/photo-storage/supabase-photo-storage';
import { supabaseAdmin } from '@/lib/supabase-admin';

/** Tells the apps which optional features this server can offer right now. */
export const capabilitiesRouter = Router();

capabilitiesRouter.get('/', (_req, res) => {
  res.json({
    data: {
      selfie: supabasePhotoStorage.isConfigured,
      documents: supabasePhotoStorage.isConfigured,
      demo: supabaseAdmin.isConfigured,
    },
  });
});
