import { z } from 'zod';

const publicEnvSchema = z.object({
  apiUrl: z.url(),
  supabaseUrl: z.url(),
  supabasePublishableKey: z.string().min(20),
});

/** Expo only inlines EXPO_PUBLIC_* values when they are read as literal property accesses. */
const parsed = publicEnvSchema.safeParse({
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

if (!parsed.success) {
  throw new Error('Missing app configuration. Copy .env.example to .env and fill it in.');
}

export const publicEnv = parsed.data;
