import type { CompleteProfileInput, UpdateProfileInput } from '@welcheq/shared';

import type { AuthIdentity } from '@/middleware/authenticate';
import { HttpError } from '@/lib/http-error';
import { profileRepository } from './profile.repository';

export const profileService = {
  async getOwnProfile(identity: AuthIdentity) {
    const profile = await profileRepository.findById(identity.userId);

    if (!profile) {
      throw HttpError.notFound('Finish setting up your profile to continue');
    }

    return profile;
  },

  async completeProfile(identity: AuthIdentity, input: CompleteProfileInput) {
    const existing = await profileRepository.findById(identity.userId);

    if (existing) {
      throw HttpError.conflict('Your profile is already set up');
    }

    return profileRepository.create(identity.userId, identity.email, input);
  },

  async updateOwnProfile(identity: AuthIdentity, input: UpdateProfileInput) {
    await this.getOwnProfile(identity);
    return profileRepository.update(identity.userId, input);
  },
};
