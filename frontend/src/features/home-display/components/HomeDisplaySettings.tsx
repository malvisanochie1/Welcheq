import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Text } from '@/components/ui/Text';
import { PATIENTS_QUERY_KEY } from '@/features/patients/hooks/use-patients';
import { ApiError } from '@/lib/api-client';
import { formatTime } from '@/lib/format-date';
import { homeDisplayApi } from '../api/home-display.api';

export interface HomeDisplaySettingsProps {
  patientId: string;
  isConfigured: boolean;
}

export function HomeDisplaySettings({ patientId, isConfigured }: HomeDisplaySettingsProps) {
  const queryClient = useQueryClient();
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const refreshPatient = () => queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY });
  const createCode = useMutation({
    mutationFn: () => homeDisplayApi.createPairingCode(patientId),
    onSuccess: refreshPatient,
  });
  const reset = useMutation({
    mutationFn: () => homeDisplayApi.reset(patientId),
    onSuccess: () => {
      setIsConfirmingReset(false);
      createCode.reset();
      return refreshPatient();
    },
  });

  const error = createCode.error ?? reset.error;

  return (
    <View className="gap-4 rounded-lg border border-border bg-surface p-4">
      <View className="gap-1">
        <Text variant="heading" className="text-base">
          Home display
        </Text>
        <Text variant="caption">
          {isConfigured
            ? 'A display has been set up. Add another device or reset if one is lost.'
            : 'Set up a spare phone or tablet that stays at the home to show the check-in code.'}
        </Text>
      </View>

      {error && (
        <FormMessage message={error instanceof ApiError ? error.message : 'Please try again.'} />
      )}

      {createCode.data ? (
        <View className="items-center gap-2 rounded-md bg-primary-soft p-4">
          <Text variant="caption">
            On the home device, choose "Set up a home display" and enter
          </Text>
          <Text variant="title" selectable className="tracking-widest text-primary">
            {createCode.data.code}
          </Text>
          <Text variant="caption">Works once, until {formatTime(createCode.data.expiresAt)}.</Text>
        </View>
      ) : (
        <Button
          label={isConfigured ? 'Add a display' : 'Get a setup code'}
          variant="secondary"
          onPress={() => createCode.mutate()}
          isLoading={createCode.isPending}
        />
      )}

      {isConfigured &&
        (isConfirmingReset ? (
          <View className="gap-2 rounded-md bg-danger-soft p-3">
            <Text variant="label" className="text-danger">
              Every display at the home will stop working until it is set up again.
            </Text>
            <Button
              label="Reset displays"
              onPress={() => reset.mutate()}
              isLoading={reset.isPending}
            />
            <Button
              label="Cancel"
              variant="secondary"
              onPress={() => setIsConfirmingReset(false)}
            />
          </View>
        ) : (
          <Button
            label="Reset displays"
            variant="ghost"
            onPress={() => setIsConfirmingReset(true)}
          />
        ))}
    </View>
  );
}
