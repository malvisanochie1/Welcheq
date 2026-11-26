import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { ErrorState } from '@/components/layout/ErrorState';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { ReviewForm } from '@/features/reviews/components/ReviewForm';
import { StarRating } from '@/features/reviews/components/StarRating';
import { TrackRecord } from '@/features/reviews/components/TrackRecord';
import { useCaregiverProfile } from '@/features/reviews/hooks/use-reviews';
import { cn } from '@/lib/cn';
import { formatShortDate } from '@/lib/format-date';

const SKELETON_HEIGHT = 320;

export default function CaregiverScreen() {
  const { patientId, caregiverId } = useLocalSearchParams<{
    patientId: string;
    caregiverId: string;
  }>();
  const profile = useCaregiverProfile(patientId, caregiverId);

  if (profile.isError) {
    return (
      <ErrorState
        title="We couldn't open this caregiver"
        message={profile.error.message}
        onRetry={() => profile.refetch()}
      />
    );
  }

  const data = profile.data;
  const ratingSummary = data?.rating.count
    ? `${data.rating.average?.toFixed(1)} from ${data.rating.count} review${data.rating.count === 1 ? '' : 's'}`
    : 'No reviews yet';

  return (
    <Screen contentClassName="gap-8">
      <ScreenHeader
        canGoBack
        title={data?.caregiver.fullName ?? 'Caregiver'}
        subtitle={
          data ? [ratingSummary, data.caregiver.phone].filter(Boolean).join(' · ') : undefined
        }
      />
      {!data ? (
        <Skeleton height={SKELETON_HEIGHT} />
      ) : (
        <>
          {data.rating.average !== null && <StarRating value={data.rating.average} />}
          <TrackRecord record={data.trackRecord} />
          {data.canReview && (
            <ReviewForm
              patientId={patientId}
              caregiverId={caregiverId}
              caregiverFirstName={data.caregiver.fullName.split(' ')[0] ?? data.caregiver.fullName}
              existing={data.ownReview}
            />
          )}
          {data.reviews.length > 0 && (
            <View className="gap-3">
              <Text variant="heading">Reviews</Text>
              <View className="rounded-lg border border-border bg-surface px-4">
                {data.reviews.map((review, index) => (
                  <View
                    key={review.id}
                    className={cn('gap-2 py-4', index > 0 && 'border-t border-border')}
                  >
                    <View className="flex-row items-center justify-between">
                      <StarRating value={review.rating} />
                      <Text variant="caption">
                        {review.reviewer} · {formatShortDate(review.updatedAt)}
                      </Text>
                    </View>
                    {review.comment && <Text variant="body">{review.comment}</Text>}
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
