import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://postgres@localhost:5432/welcheq_test',
      SUPABASE_URL: 'https://example.supabase.co',
      CORS_ORIGINS: 'http://localhost:8081',
    },
  },
});
