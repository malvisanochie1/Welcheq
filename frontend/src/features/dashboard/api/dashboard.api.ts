import type { DashboardPeriod, Wellbeing } from '@welcheq/shared';

import { apiRequest } from '@/lib/api-client';

export interface AttendanceTally {
  scheduled: number;
  completed: number;
  late: number;
  missed: number;
  onTimeRate: number | null;
}

export interface DashboardOverview {
  days: DashboardPeriod;
  totals: AttendanceTally & { openIncidents: number };
  patients: Array<
    AttendanceTally & {
      id: string;
      fullName: string;
      openIncidents: number;
      lastVisitAt: string | null;
      latestWellbeing: Wellbeing | null;
    }
  >;
  caregivers: Array<
    AttendanceTally & { id: string; fullName: string; averageRating: number | null }
  >;
}

export const dashboardApi = {
  overview: (days: DashboardPeriod) => apiRequest<DashboardOverview>(`/v1/dashboard?days=${days}`),
};
