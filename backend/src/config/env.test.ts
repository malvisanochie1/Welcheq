import { describe, expect, it, vi } from 'vitest';

const VALID = {
  DATABASE_URL: 'postgresql://postgres@localhost:5432/welcheq_test',
  SUPABASE_URL: 'https://example.supabase.co',
  CORS_ORIGINS: 'http://localhost:8081',
};

async function loadWith(values: Record<string, string>) {
  vi.resetModules();
  for (const [key, value] of Object.entries({ ...VALID, ...values })) {
    vi.stubEnv(key, value);
  }
  return import('./env');
}

describe('environment configuration', () => {
  it('accepts the expected addresses', async () => {
    await expect(loadWith({})).resolves.toBeDefined();
  });

  it('refuses to start when the two addresses are swapped', async () => {
    await expect(
      loadWith({ DATABASE_URL: VALID.SUPABASE_URL, SUPABASE_URL: VALID.DATABASE_URL }),
    ).rejects.toThrow(/DATABASE_URL must be a postgresql:\/\/ connection string/);
  });
});
