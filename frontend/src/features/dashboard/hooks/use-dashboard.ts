import type { DashboardPeriod } from '@welcheq/shared';
import { useQuery } from '@tanstack/react-query';

import { dashboardApi } from '../api/dashboard.api';

const REFRESH_MS = 5 * 60_000;

export function useDashboard(days: DashboardPeriod) {
  return useQuery({
    queryKey: ['dashboard', days],
    queryFn: () => dashboardApi.overview(days),
    refetchInterval: REFRESH_MS,
  });
}
