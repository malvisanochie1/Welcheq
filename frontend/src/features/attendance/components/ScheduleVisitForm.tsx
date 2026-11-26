import { CARE_RELATIONSHIP, createShiftSchema } from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { EmptyState } from '@/components/layout/EmptyState';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { FormMessage } from '@/components/ui/FormMessage';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { REPEAT_WEEK_CHOICES } from '@/config/attendance';
import { useCareTeam } from '@/features/care-team/hooks/use-care-team';
import { ApiError } from '@/lib/api-client';
import { toFieldErrors, type FieldErrors } from '@/lib/form-errors';
import { useScheduleShifts } from '../hooks/use-attendance';

interface Draft {
  caregiverId: string;
  date: string;
  startTime: string;
  endTime: string;
  repeatWeeks: number;
}

export interface ScheduleVisitFormProps {
  patientId: string;
  defaultDate: string;
  onScheduled: () => void;
}

export function ScheduleVisitForm({ patientId, defaultDate, onScheduled }: ScheduleVisitFormProps) {
  const members = useCareTeam(patientId);
  const schedule = useScheduleShifts(patientId);
  const caregivers = (members.data ?? []).filter(
    (member) => member.relationship === CARE_RELATIONSHIP.CAREGIVER,
  );
  const [draft, setDraft] = useState<Draft>({
    caregiverId: '',
    date: defaultDate,
    startTime: '08:00',
    endTime: '16:00',
    repeatWeeks: 0,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<keyof Draft>>({});
  const update = <TKey extends keyof Draft>(key: TKey, value: Draft[TKey]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  if (members.data && caregivers.length === 0) {
    return (
      <EmptyState
        title="Invite a caregiver first"
        message="Visits are scheduled for caregivers on this care team."
      />
    );
  }

  const submit = () => {
    const parsed = createShiftSchema.safeParse(draft);
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    schedule.mutate(parsed.data, { onSuccess: onScheduled });
  };

  const errorMessage =
    schedule.error instanceof ApiError
      ? schedule.error.message
      : schedule.error && 'Please try again.';

  return (
    <View className="gap-6">
      {errorMessage && <FormMessage message={errorMessage} />}

      <View className="gap-3">
        <Text variant="label">Caregiver</Text>
        <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
          {caregivers.map((caregiver) => (
            <Chip
              key={caregiver.userId}
              role="radio"
              label={caregiver.fullName}
              isSelected={draft.caregiverId === caregiver.userId}
              onPress={() => update('caregiverId', caregiver.userId)}
            />
          ))}
        </View>
        {fieldErrors.caregiverId && (
          <Text variant="caption" className="text-danger">
            Choose who will visit
          </Text>
        )}
      </View>

      <TextField
        label="Date"
        value={draft.date}
        onChangeText={(value) => update('date', value)}
        errorMessage={fieldErrors.date}
        placeholder="YYYY-MM-DD"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <TextField
            label="Arrives"
            value={draft.startTime}
            onChangeText={(value) => update('startTime', value)}
            errorMessage={fieldErrors.startTime}
            placeholder="08:00"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
        </View>
        <View className="flex-1">
          <TextField
            label="Leaves"
            value={draft.endTime}
            onChangeText={(value) => update('endTime', value)}
            errorMessage={fieldErrors.endTime}
            placeholder="16:00"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
        </View>
      </View>

      <View className="gap-3">
        <Text variant="label">Repeat every week for</Text>
        <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
          {REPEAT_WEEK_CHOICES.map((choice) => (
            <Chip
              key={choice.weeks}
              role="radio"
              label={choice.label}
              isSelected={draft.repeatWeeks === choice.weeks}
              onPress={() => update('repeatWeeks', choice.weeks)}
            />
          ))}
        </View>
      </View>

      <Button label="Schedule visit" onPress={submit} isLoading={schedule.isPending} />
    </View>
  );
}
