import {
  CARE_TASK_CATEGORIES,
  CARE_TASK_CATEGORY,
  careTaskInputSchema,
  type CareTaskCategory,
} from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { CATEGORY_DETAILS, WEEKDAY_SHORT_LABELS } from '@/config/care-plan';
import { ApiError } from '@/lib/api-client';
import { toFieldErrors, type FieldErrors } from '@/lib/form-errors';
import type { CareTask } from '../api/care-plan.api';

export interface CareTaskDraft {
  title: string;
  category: CareTaskCategory;
  time: string;
  daysOfWeek: number[];
  instructions: string;
}

export interface CareTaskFormProps {
  initialTask?: CareTask;
  isSaving: boolean;
  error: Error | null;
  onSubmit: (draft: ReturnType<typeof careTaskInputSchema.parse>) => void;
}

export function CareTaskForm({ initialTask, isSaving, error, onSubmit }: CareTaskFormProps) {
  const [draft, setDraft] = useState<CareTaskDraft>({
    title: initialTask?.title ?? '',
    category: initialTask?.category ?? CARE_TASK_CATEGORY.MEDICATION,
    time: initialTask?.time ?? '',
    daysOfWeek: initialTask?.daysOfWeek ?? [],
    instructions: initialTask?.instructions ?? '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<keyof CareTaskDraft>>({});
  const isEveryDay = draft.daysOfWeek.length === 0;

  const toggleDay = (day: number) =>
    setDraft((current) => ({
      ...current,
      daysOfWeek: current.daysOfWeek.includes(day)
        ? current.daysOfWeek.filter((candidate) => candidate !== day)
        : [...current.daysOfWeek, day].sort(),
    }));

  const submit = () => {
    const parsed = careTaskInputSchema.safeParse({
      ...draft,
      instructions: draft.instructions.trim() || undefined,
    });
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    onSubmit(parsed.data);
  };

  const submitError = error instanceof ApiError ? error.message : error && 'Please try again.';

  return (
    <View className="gap-6">
      {submitError && <FormMessage message={submitError} />}

      <TextField
        label="Task"
        value={draft.title}
        onChangeText={(title) => setDraft((current) => ({ ...current, title }))}
        errorMessage={fieldErrors.title}
        placeholder="Give evening blood pressure medicine"
      />

      <View className="gap-3">
        <Text variant="label">Type</Text>
        <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
          {CARE_TASK_CATEGORIES.map((category) => (
            <Chip
              key={category}
              role="radio"
              label={CATEGORY_DETAILS[category].label}
              isSelected={draft.category === category}
              onPress={() => setDraft((current) => ({ ...current, category }))}
            />
          ))}
        </View>
      </View>

      <TextField
        label="Time (24-hour)"
        value={draft.time}
        onChangeText={(time) => setDraft((current) => ({ ...current, time }))}
        errorMessage={fieldErrors.time}
        placeholder="20:00"
        keyboardType="numbers-and-punctuation"
        maxLength={5}
      />

      <View className="gap-3">
        <Text variant="label">Which days</Text>
        <View className="flex-row flex-wrap gap-2">
          <Chip
            label="Every day"
            isSelected={isEveryDay}
            onPress={() => setDraft((current) => ({ ...current, daysOfWeek: [] }))}
          />
          {WEEKDAY_SHORT_LABELS.map((label, day) => (
            <Chip
              key={label}
              label={label}
              isSelected={draft.daysOfWeek.includes(day)}
              onPress={() => toggleDay(day)}
            />
          ))}
        </View>
      </View>

      <TextField
        label="Instructions for the caregiver (optional)"
        value={draft.instructions}
        onChangeText={(instructions) => setDraft((current) => ({ ...current, instructions }))}
        errorMessage={fieldErrors.instructions}
        placeholder="Give with food. Two tablets."
        multiline
      />

      <Button label="Save task" onPress={submit} isLoading={isSaving} />
    </View>
  );
}
