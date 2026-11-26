import type * as Jose from 'jose';
import { vi } from 'vitest';

import { testJwks } from './auth-tokens';

vi.mock('jose', async (importOriginal) => {
  const jose = await importOriginal<typeof Jose>();
  return { ...jose, createRemoteJWKSet: () => jose.createLocalJWKSet(testJwks) };
});
