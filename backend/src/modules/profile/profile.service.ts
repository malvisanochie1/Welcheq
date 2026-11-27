import type { CompleteProfileInput, UpdateProfileInput } from '@welcheq/shared';

import type { AuthIdentity } from '@/middleware/authenticate';
import { HttpError } from '@/lib/http-error';
import { ACCOUNT_DELETED_MESSAGE } from '@/middleware/require-profile';
import { DEMO_READ_ONLY_MESSAGE } from '@/modules/demo/demo.constants';
import { deleteAccount } from './account-deletion.service';
import { profileRepository } from './profile.repository';

async function findActiveProfile(userId: string) {
  if (await profileRepository.isDeleted(userId)) {
    throw HttpError.forbidden(ACCOUNT_DELETED_MESSAGE);
  }
  return profileRepository.findById(userId);
}

/** Demo accounts are shared, so nobody may rename or delete them. */
async function requireOwnAccount(identity: AuthIdentity) {
  const profile = await profileService.getOwnProfile(identity);
  if (profile.isDemo) {
    throw HttpError.forbidden(DEMO_READ_ONLY_MESSAGE);
  }
  return profile;
}

export const profileService = {
  async getOwnProfile(identity: AuthIdentity) {
    const profile = await findActiveProfile(identity.userId);

    if (!profile) {
      throw HttpError.notFound('Finish setting up your profile to continue');
    }

    return profile;
  },

  async completeProfile(identity: AuthIdentity, input: CompleteProfileInput) {
    const existing = await findActiveProfile(identity.userId);

    if (existing) {
      throw HttpError.conflict('Your profile is already set up');
    }

    return profileRepository.create(identity.userId, identity.email, input);
  },

  async updateOwnProfile(identity: AuthIdentity, input: UpdateProfileInput) {
    await requireOwnAccount(identity);
    return profileRepository.update(identity.userId, input);
  },

  async deleteOwnAccount(identity: AuthIdentity) {
    await requireOwnAccount(identity);
    await deleteAccount(identity.userId);
  },
};
