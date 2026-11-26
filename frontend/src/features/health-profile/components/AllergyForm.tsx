import {
  ALLERGY_SEVERITY,
  allergyInputSchema,
  HEALTH_PROFILE_LIMITS,
  type AllergyInput,
  type AllergySeverity,
} from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { ALLERGY_SEVERITY_DETAILS } from '@/config/health-profile';
import { describeRequestError } from '@/lib/form-errors';
import { healthProfileApi } from '../api/health-profile.api';
import { useHealthProfileChange } from '../hooks/use-health-profile';
import { FormActions } from './FormActions';

export interface AllergyFormProps {
  patientId: string;
  onDone: () => void;
}

export function AllergyForm({ patientId, onDone }: AllergyFormProps) {
  const [substance, setSubstance] = useState('');
  const [reaction, setReaction] = useState('');
  const [severity, setSeverity] = useState<AllergySeverity>(ALLERGY_SEVERITY.MODERATE);
  const [formError, setFormError] = useState<string | null>(null);
  const save = useHealthProfileChange(patientId, (input: AllergyInput) =>
    healthProfileApi.addAllergy(patientId, input),
  );

  const submit = () => {
    const input = { substance, reaction, severity };
    const parsed = allergyInputSchema.safeParse(input);
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
        label="Allergic to"
        value={substance}
        onChangeText={setSubstance}
        placeholder="Penicillin"
        maxLength={HEALTH_PROFILE_LIMITS.NAME_MAX_LENGTH}
      />
      <TextField
        label="What happens (optional)"
        value={reaction}
        onChangeText={setReaction}
        placeholder="Itchy rash and swelling"
        maxLength={HEALTH_PROFILE_LIMITS.DETAIL_MAX_LENGTH}
      />
      <View className="gap-3">
        <Text variant="label">How serious</Text>
        <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
          {Object.values(ALLERGY_SEVERITY).map((option) => (
            <Chip
              key={option}
              role="radio"
              label={ALLERGY_SEVERITY_DETAILS[option].label}
              isSelected={severity === option}
              onPress={() => setSeverity(option)}
            />
          ))}
        </View>
      </View>
      <FormActions
        saveLabel="Add allergy"
        errorMessage={formError ?? describeRequestError(save.error)}
        isSaving={save.isPending}
        onSave={submit}
        onCancel={onDone}
      />
    </View>
  );
}
