import { READING_TYPE, READING_TYPES } from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { FormMessage } from '@/components/ui/FormMessage';
import { Text } from '@/components/ui/Text';
import { READING_DETAILS } from '@/config/health-records';
import { ApiError } from '@/lib/api-client';
import { useAddReading } from '../hooks/use-health-records';
import { emptyDraft, parseReadingDraft } from '../lib/reading-draft';
import { ReadingFields } from './ReadingFields';

export function AddReadingForm({ patientId }: { patientId: string }) {
  const addReading = useAddReading(patientId);
  const [draft, setDraft] = useState(emptyDraft(READING_TYPE.BLOOD_PRESSURE));
  const [error, setError] = useState<string | undefined>();
  const [savedType, setSavedType] = useState<string | null>(null);

  const submit = () => {
    const result = parseReadingDraft(draft);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(undefined);
    addReading.mutate(result.reading, {
      onSuccess: () => {
        setSavedType(READING_DETAILS[draft.type].label);
        setDraft(emptyDraft(draft.type));
      },
    });
  };

  const apiError =
    addReading.error instanceof ApiError
      ? addReading.error.message
      : addReading.error && 'Please try again.';

  return (
    <View className="gap-4 rounded-lg border border-border bg-surface p-4">
      <Text variant="heading">Add a reading</Text>
      <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
        {READING_TYPES.map((type) => (
          <Chip
            key={type}
            role="radio"
            label={READING_DETAILS[type].label}
            isSelected={draft.type === type}
            onPress={() => {
              setDraft(emptyDraft(type));
              setError(undefined);
              setSavedType(null);
            }}
          />
        ))}
      </View>
      <ReadingFields
        draft={draft}
        errorMessage={error}
        onChange={(next) => {
          setDraft(next);
          setSavedType(null);
        }}
      />
      {apiError && <FormMessage message={apiError} />}
      {savedType && <FormMessage tone="info" message={`${savedType} saved.`} />}
      <Button label="Save reading" onPress={submit} isLoading={addReading.isPending} />
    </View>
  );
}
