import { useMutation } from '@tanstack/react-query';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Text } from '@/components/ui/Text';
import { describeRequestError } from '@/lib/form-errors';
import { shareHealthRecord } from '../lib/share-record';

export interface ShareRecordCardProps {
  patientId: string;
  patientName: string;
}

export function ShareRecordCard({ patientId, patientName }: ShareRecordCardProps) {
  const share = useMutation({ mutationFn: () => shareHealthRecord(patientId, patientName) });
  const errorMessage = describeRequestError(share.error);

  return (
    <View className="gap-3 rounded-lg border border-border bg-surface p-4">
      <Text variant="heading">Share with a doctor</Text>
      <Text variant="body" className="text-ink-muted">
        Creates a copy of the medicines, allergies, conditions and readings in FHIR, the format
        clinic and hospital systems can import.
      </Text>
      {errorMessage && <FormMessage message={errorMessage} />}
      <Button
        label="Export health record"
        variant="secondary"
        onPress={() => share.mutate()}
        isLoading={share.isPending}
      />
    </View>
  );
}
