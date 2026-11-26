import { useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { describeRequestError } from '@/lib/form-errors';
import { radius } from '@/theme';
import { healthProfileApi, type HealthDocument } from '../api/health-profile.api';

const DOCUMENT_ASPECT_RATIO = 3 / 4;

export interface DocumentViewerProps {
  patientId: string;
  document: HealthDocument;
}

/** Fetches a short-lived link only when asked, so documents are never loaded in bulk. */
export function DocumentViewer({ patientId, document }: DocumentViewerProps) {
  const view = useMutation({
    mutationFn: () => healthProfileApi.viewDocument(patientId, document.id),
  });
  const errorMessage = describeRequestError(view.error);

  if (!view.data) {
    return (
      <View className="gap-2">
        {errorMessage && <FormMessage message={errorMessage} />}
        <Button
          label="Open"
          variant="ghost"
          onPress={() => view.mutate()}
          isLoading={view.isPending}
        />
      </View>
    );
  }

  return (
    <View className="gap-2">
      <Image
        source={{ uri: view.data.url }}
        accessibilityLabel={document.title}
        contentFit="contain"
        style={{ width: '100%', aspectRatio: DOCUMENT_ASPECT_RATIO, borderRadius: radius.md }}
      />
      <Button label="Close" variant="ghost" onPress={() => view.reset()} />
    </View>
  );
}
