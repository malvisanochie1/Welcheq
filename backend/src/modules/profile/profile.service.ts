import type { CompleteProfileInput, UpdateProfileInput } from '@welcheq/shared';

import type { AuthIdentity } from '@/middleware/authenticate';
import { HttpError } from '@/lib/http-error';
import { ACCOUNT_DELETED_MESSAGE } from '@/middleware/require-profile';
import { deleteAccount } from './account-deletion.service';
import { profileRepository } from './profile.repository';

async function findActiveProfile(userId: string) {
  if (await profileRepository.isDeleted(userId)) {
    throw HttpError.forbidden(ACCOUNT_DELETED_MESSAGE);
  }
  return profileRepository.findById(userId);
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
    await this.getOwnProfile(identity);
    return profileRepository.update(identity.userId, input);
  },

  async deleteOwnAccount(identity: AuthIdentity) {
    await this.getOwnProfile(identity);
    await deleteAccount(identity.userId);
  },
};
