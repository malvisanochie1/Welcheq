import { randomUUID } from 'node:crypto';

import { exportJWK, generateKeyPair, SignJWT, type JWK } from 'jose';

const TEST_ISSUER = 'https://example.supabase.co/auth/v1';
const TEST_AUDIENCE = 'authenticated';
const SIGNING_ALGORITHM = 'ES256';
const KEY_ID = 'test-signing-key';

const { privateKey, publicKey } = await generateKeyPair(SIGNING_ALGORITHM);

export const testJwks: { keys: JWK[] } = {
  keys: [{ ...(await exportJWK(publicKey)), kid: KEY_ID, alg: SIGNING_ALGORITHM }],
};

export interface TestUser {
  userId: string;
  email: string;
}

export function createTestUser(): TestUser {
  const userId = randomUUID();
  return { userId, email: `${userId.slice(0, 8)}@example.test` };
}

export function signAccessToken(user: TestUser, { expiresIn = '15m' } = {}) {
  return new SignJWT({ email: user.email, role: TEST_AUDIENCE })
    .setProtectedHeader({ alg: SIGNING_ALGORITHM, kid: KEY_ID })
    .setSubject(user.userId)
    .setIssuer(TEST_ISSUER)
    .setAudience(TEST_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(privateKey);
}
