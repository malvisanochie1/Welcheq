import { conditionInputSchema, HEALTH_PROFILE_LIMITS, type ConditionInput } from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { TextField } from '@/components/ui/TextField';
import { describeRequestError } from '@/lib/form-errors';
import { healthProfileApi } from '../api/health-profile.api';
import { useHealthProfileChange } from '../hooks/use-health-profile';
import { FormActions } from './FormActions';

const YEAR_PATTERN = /^\d{4}$/;
const YEAR_LENGTH = 4;

export interface ConditionFormProps {
  patientId: string;
  onDone: () => void;
}

export function ConditionForm({ patientId, onDone }: ConditionFormProps) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [year, setYear] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const save = useHealthProfileChange(patientId, (input: ConditionInput) =>
    healthProfileApi.addCondition(patientId, input),
  );

  const submit = () => {
    if (year && (!YEAR_PATTERN.test(year) || Number(year) > new Date().getFullYear())) {
      setFormError('Enter the year as four digits, for example 2019.');
      return;
    }
    const input = { name, notes, diagnosedOn: year ? `${year}-01-01` : null };
    const parsed = conditionInputSchema.safeParse(input);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Check the details.');
      return;
    }
    setFormError(null);
    save.mutate(input, { onSuccess: onDone });
  };

  return (
    <View className="gap-4 rounded-lg border border-border bg-surface p-4">
      <TextField
        label="Condition"
        value={name}
        onChangeText={setName}
        placeholder="High blood pressure"
        maxLength={HEALTH_PROFILE_LIMITS.NAME_MAX_LENGTH}
      />
      <TextField
        label="Year diagnosed (optional)"
        value={year}
        onChangeText={(text) => setYear(text.replace(/\D/g, '').slice(0, YEAR_LENGTH))}
        placeholder="2019"
        keyboardType="number-pad"
        maxLength={YEAR_LENGTH}
      />
      <TextField
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Checked by Dr Obi every three months"
        maxLength={HEALTH_PROFILE_LIMITS.DETAIL_MAX_LENGTH}
        multiline
      />
      <FormActions
        saveLabel="Add condition"
        errorMessage={formError ?? describeRequestError(save.error)}
        isSaving={save.isPending}
        onSave={submit}
        onCancel={onDone}
      />
    </View>
  );
}
