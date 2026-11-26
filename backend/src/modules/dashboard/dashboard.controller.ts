import { DASHBOARD_PERIODS, DEFAULT_DASHBOARD_PERIOD } from '@welcheq/shared';
import type { RequestHandler } from 'express';
import { z } from 'zod';

import { requireActingUser } from '@/middleware/require-profile';
import { dashboardService } from './dashboard.service';

const querySchema = z.object({
  days: z.coerce
    .number()
    .pipe(z.union(DASHBOARD_PERIODS.map((days) => z.literal(days))))
    .default(DEFAULT_DASHBOARD_PERIOD),
});

export const dashboardController = {
  overview: (async (req, res) => {
    const { days } = querySchema.parse(req.query);
    const overview = await dashboardService.overview(requireActingUser(req.actingUser), days);
    res.json({ data: overview });
  }) satisfies RequestHandler,
};
