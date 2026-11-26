import type { Express } from 'express';
import request from 'supertest';

import { createTestUser, signAccessToken, type TestUser } from './auth-tokens';

export interface SignedInUser extends TestUser {
  header: { Authorization: string };
}

export async function signIn(user: TestUser = createTestUser()): Promise<SignedInUser> {
  return { ...user, header: { Authorization: `Bearer ${await signAccessToken(user)}` } };
}

export async function signUpWithProfile(app: Express, role: string, fullName = 'Test Person') {
  const user = await signIn();
  await request(app).post('/v1/me').set(user.header).send({ fullName, role }).expect(201);
  return user;
}
