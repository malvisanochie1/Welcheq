import { completeProfileSchema, updateProfileSchema } from '@welcheq/shared';
import type { RequestHandler } from 'express';

import { requireIdentity } from '@/middleware/authenticate';
import { profileService } from './profile.service';

export const profileController = {
  getOwn: (async (req, res) => {
    const profile = await profileService.getOwnProfile(requireIdentity(req.identity));
    res.json({ data: profile });
  }) satisfies RequestHandler,

  complete: (async (req, res) => {
    const input = completeProfileSchema.parse(req.body);
    const profile = await profileService.completeProfile(requireIdentity(req.identity), input);
    res.status(201).json({ data: profile });
  }) satisfies RequestHandler,

  deleteOwn: (async (req, res) => {
    await profileService.deleteOwnAccount(requireIdentity(req.identity));
    res.status(204).end();
  }) satisfies RequestHandler,

  updateOwn: (async (req, res) => {
    const input = updateProfileSchema.parse(req.body);
    const profile = await profileService.updateOwnProfile(requireIdentity(req.identity), input);
    res.json({ data: profile });
  }) satisfies RequestHandler,
};
