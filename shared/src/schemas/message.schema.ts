import { z } from 'zod';

import { MESSAGE_RULES } from '../constants/messages';

export const messageInputSchema = z.strictObject({
  body: z.string().trim().min(1, 'Write a message first').max(MESSAGE_RULES.BODY_MAX_LENGTH),
});

export type MessageInput = z.infer<typeof messageInputSchema>;

export const messageQuerySchema = z.object({
  before: z.iso.datetime({ offset: true }).optional(),
});
