import type { ReviewInput } from '@welcheq/shared';

import { apiRequest } from '@/lib/api-client';

export interface CaregiverProfile {
  caregiver: { id: string; fullName: string; phone: string | null };
  rating: { average: number | null; count: number };
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    updatedAt: string;
    reviewer: string;
  }>;
  trackRecord: {
    days: number;
    visits: number;
    late: number;
    earlyDepartures: number;
    missed: number;
  };
  ownReview: { rating: number; comment: string | null } | null;
  canReview: boolean;
}

const caregiverPath = (patientId: string, caregiverId: string) =>
  `/v1/patients/${encodeURIComponent(patientId)}/caregivers/${encodeURIComponent(caregiverId)}`;

export const reviewsApi = {
  profile: (patientId: string, caregiverId: string) =>
    apiRequest<CaregiverProfile>(caregiverPath(patientId, caregiverId)),
  review: (patientId: string, caregiverId: string, input: ReviewInput) =>
    apiRequest<void>(`${caregiverPath(patientId, caregiverId)}/review`, {
      method: 'PUT',
      body: input,
    }),
};
