import type { CompleteProfileInput, UpdateProfileInput } from '@welcheq/shared';

import { prisma } from '@/lib/prisma';

const PROFILE_FIELDS = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  createdAt: true,
} as const;

export const profileRepository = {
  findById(userId: string) {
    return prisma.user.findUnique({ where: { id: userId }, select: PROFILE_FIELDS });
  },

  create(userId: string, email: string, input: CompleteProfileInput) {
    return prisma.user.create({
      data: { id: userId, email, ...input },
      select: PROFILE_FIELDS,
    });
  },

  update(userId: string, input: UpdateProfileInput) {
    return prisma.user.update({ where: { id: userId }, data: input, select: PROFILE_FIELDS });
  },
};

export type Profile = NonNullable<Awaited<ReturnType<typeof profileRepository.findById>>>;
