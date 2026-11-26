import { BellRing } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Text } from '@/components/ui/Text';
import { ApiError } from '@/lib/api-client';
import { palette } from '@/theme';
import { useAnswerSurpriseCheck } from '../hooks/use-attendance';
import { LocationUnavailableError, readCurrentLocation } from '../lib/read-location';

const ICON_SIZE = 22;

export interface SurpriseCheckPromptProps {
  patientId: string;
  visitId: string;
  patientFirstName: string;
}

export function SurpriseCheckPrompt({
  patientId,
  visitId,
  patientFirstName,
}: SurpriseCheckPromptProps) {
  const answer = useAnswerSurpriseCheck(patientId);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const confirm = async () => {
    setErrorMessage(null);
    setIsLocating(true);
    try {
      const location = await readCurrentLocation();
      await answer.mutateAsync({
        visitId,
        input: { location, capturedAt: new Date().toISOString() },
      });
    } catch (error) {
      const isKnown = error instanceof LocationUnavailableError || error instanceof ApiError;
      setErrorMessage(isKnown ? error.message : 'Please try again.');
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <View
      accessibilityRole="alert"
      className="gap-3 rounded-lg border-2 border-accent bg-accent-soft p-4"
    >
      <View className="flex-row items-center gap-2">
        <BellRing size={ICON_SIZE} color={palette.accent} />
        <Text variant="heading" className="flex-1">
          Quick check
        </Text>
      </View>
      <Text variant="body">
        Confirm you are still with {patientFirstName}. This takes one tap and uses your location
        once.
      </Text>
      {errorMessage && <FormMessage message={errorMessage} />}
      <Button label="I'm still here" onPress={confirm} isLoading={isLocating || answer.isPending} />
    </View>
  );
}
