import { useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Text } from '@/components/ui/Text';
import { ApiError } from '@/lib/api-client';
import { formatTime } from '@/lib/format-date';
import { radius } from '@/theme';
import { attendanceApi } from '../api/attendance.api';

const PHOTO_ASPECT_RATIO = 3 / 4;

export interface SelfieViewerProps {
  patientId: string;
  visitId: string;
  takenAt: string;
}

/** Fetches a short-lived link only when asked, so photos are never loaded in bulk. */
export function SelfieViewer({ patientId, visitId, takenAt }: SelfieViewerProps) {
  const view = useMutation({ mutationFn: () => attendanceApi.viewSelfie(patientId, visitId) });

  if (!view.data) {
    return (
      <View className="gap-2 self-start">
        {view.error && (
          <FormMessage
            message={view.error instanceof ApiError ? view.error.message : 'Please try again.'}
          />
        )}
        <Button
          label="View check-in selfie"
          variant="ghost"
          onPress={() => view.mutate()}
          isLoading={view.isPending}
        />
      </View>
    );
  }

  return (
    <View className="w-3/5 gap-1">
      <Image
        source={{ uri: view.data.url }}
        accessibilityLabel={`Check-in selfie taken at ${formatTime(takenAt)}`}
        contentFit="cover"
        style={{ width: '100%', aspectRatio: PHOTO_ASPECT_RATIO, borderRadius: radius.md }}
      />
      <Text variant="caption">Taken at check-in, {formatTime(takenAt)}</Text>
    </View>
  );
}
