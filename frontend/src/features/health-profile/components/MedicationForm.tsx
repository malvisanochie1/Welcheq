import {
  HEALTH_PROFILE_LIMITS,
  medicationInputSchema,
  type MedicationInput,
} from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { TextField } from '@/components/ui/TextField';
import { describeRequestError } from '@/lib/form-errors';
import { healthProfileApi, type Medication } from '../api/health-profile.api';
import { useHealthProfileChange } from '../hooks/use-health-profile';
import { FormActions } from './FormActions';

export interface MedicationFormProps {
  patientId: string;
  existing?: Medication;
  onDone: () => void;
}

export function MedicationForm({ patientId, existing, onDone }: MedicationFormProps) {
  const [name, setName] = useState(existing?.name ?? '');
  const [dose, setDose] = useState(existing?.dose ?? '');
  const [instructions, setInstructions] = useState(existing?.instructions ?? '');
  const [formError, setFormError] = useState<string | null>(null);
  const save = useHealthProfileChange(patientId, (input: MedicationInput) =>
    existing
      ? healthProfileApi.updateMedication(patientId, existing.id, input)
      : healthProfileApi.addMedication(patientId, input),
  );

  const submit = () => {
    const parsed = medicationInputSchema.safeParse({ name, dose, instructions });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Check the details.');
      return;
    }
    setFormError(null);
    save.mutate({ name, dose, instructions }, { onSuccess: onDone });
  };

  return (
    <View className="gap-4 rounded-lg border border-border bg-surface p-4">
      <TextField
        label="Medicine"
        value={name}
        onChangeText={setName}
        placeholder="Amlodipine"
        maxLength={HEALTH_PROFILE_LIMITS.NAME_MAX_LENGTH}
      />
      <TextField
        label="Dose (optional)"
        value={dose}
        onChangeText={setDose}
        placeholder="5 mg"
        maxLength={HEALTH_PROFILE_LIMITS.NAME_MAX_LENGTH}
      />
      <TextField
        label="How and when (optional)"
        value={instructions}
        onChangeText={setInstructions}
        placeholder="One tablet every morning after breakfast"
        maxLength={HEALTH_PROFILE_LIMITS.DETAIL_MAX_LENGTH}
        multiline
      />
      <FormActions
        saveLabel={existing ? 'Save changes' : 'Add medicine'}
        errorMessage={formError ?? describeRequestError(save.error)}
        isSaving={save.isPending}
        onSave={submit}
        onCancel={onDone}
      />
    </View>
  );
}
