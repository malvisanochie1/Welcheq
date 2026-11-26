import { REVIEW_RULES } from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { describeRequestError } from '@/lib/form-errors';
import type { CaregiverProfile } from '../api/reviews.api';
import { useReviewCaregiver } from '../hooks/use-reviews';
import { StarRating } from './StarRating';

export interface ReviewFormProps {
  patientId: string;
  caregiverId: string;
  caregiverFirstName: string;
  existing: CaregiverProfile['ownReview'];
}

export function ReviewForm({
  patientId,
  caregiverId,
  caregiverFirstName,
  existing,
}: ReviewFormProps) {
  const review = useReviewCaregiver(patientId, caregiverId);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? '');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const submit = () => {
    if (rating < REVIEW_RULES.MIN_RATING) {
      setFormError('Choose a rating from one to five stars.');
      return;
    }
    setFormError(null);
    review.mutate({ rating, comment }, { onSuccess: () => setIsSaved(true) });
  };

  const message = formError ?? describeRequestError(review.error);

  return (
    <View className="gap-4 rounded-lg border border-border bg-surface p-4">
      <Text variant="heading">{existing ? 'Your review' : `Rate ${caregiverFirstName}`}</Text>
      <StarRating
        value={rating}
        onChange={(value) => {
          setRating(value);
          setIsSaved(false);
        }}
      />
      <TextField
        label="What stood out? (optional)"
        value={comment}
        onChangeText={(text) => {
          setComment(text);
          setIsSaved(false);
        }}
        placeholder="Always on time and very gentle with mum"
        maxLength={REVIEW_RULES.COMMENT_MAX_LENGTH}
        multiline
      />
      {message && <FormMessage message={message} />}
      {isSaved && <FormMessage tone="info" message="Thank you. Your review is saved." />}
      <Button
        label={existing ? 'Update review' : 'Save review'}
        onPress={submit}
        isLoading={review.isPending}
      />
    </View>
  );
}
