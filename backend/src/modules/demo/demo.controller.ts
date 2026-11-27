import type { RequestHandler } from 'express';
import { z } from 'zod';

import { DEMO_PERSONA } from './demo.constants';
import { demoService } from './demo.service';

const sessionSchema = z.strictObject({ persona: z.enum(Object.values(DEMO_PERSONA)) });

export const demoController = {
  startSession: (async (req, res) => {
    const { persona } = sessionSchema.parse(req.body);
    res.status(201).json({ data: await demoService.startSession(persona) });
  }) satisfies RequestHandler,
};
