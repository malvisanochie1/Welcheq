import {
  CARE_RELATIONSHIP,
  MANDATORY_PROOF_METHODS,
  proofSettingsSchema,
  type ProofMethod,
  type ProofSettingsInput,
} from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { PressableScale } from '@/components/ui/PressableScale';
import { SwitchRow } from '@/components/ui/SwitchRow';
import { Text } from '@/components/ui/Text';
import { GEOFENCE_RADIUS_CHOICES, PROOF_METHOD_OPTIONS } from '@/config/proof-methods';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import type { Patient } from '../api/patients.api';
import { useUpdateProofSettings } from '../hooks/use-patients';

export interface ProofSettingsFormProps {
  patient: Patient;
  onSaved: () => void;
}

const isMandatory = (method: ProofMethod) => MANDATORY_PROOF_METHODS.includes(method);

export function ProofSettingsForm({ patient, onSaved }: ProofSettingsFormProps) {
  const [settings, setSettings] = useState<ProofSettingsInput>(patient.proofSettings);
  const updateProofSettings = useUpdateProofSettings(patient.id);
  const isEditable = patient.relationship === CARE_RELATIONSHIP.OWNER;

  const toggleMethod = (method: ProofMethod, isOn: boolean) =>
    setSettings((current) => ({
      ...current,
      methods: isOn
        ? PROOF_METHOD_OPTIONS.map((option) => option.method).filter(
            (candidate) => candidate === method || current.methods.includes(candidate),
          )
        : current.methods.filter((candidate) => candidate !== method),
    }));

  const save = () => {
    const parsed = proofSettingsSchema.safeParse(settings);
    if (parsed.success) {
      updateProofSettings.mutate(parsed.data, { onSuccess: onSaved });
    }
  };

  const errorMessage =
    updateProofSettings.error instanceof ApiError
      ? updateProofSettings.error.message
      : updateProofSettings.error && 'Please try again.';

  return (
    <View className="gap-8">
      {errorMessage && <FormMessage message={errorMessage} />}

      <View className="gap-1 rounded-lg border border-border bg-surface px-4">
        {PROOF_METHOD_OPTIONS.map((option, index) => (
          <View key={option.method} className={cn('py-4', index > 0 && 'border-t border-border')}>
            <SwitchRow
              title={option.title}
              description={option.description}
              value={settings.methods.includes(option.method)}
              onValueChange={(isOn) => toggleMethod(option.method, isOn)}
              isDisabled={!isEditable || isMandatory(option.method)}
            />
          </View>
        ))}
      </View>

      <View className="gap-3">
        <Text variant="label">How close counts as "at the home"</Text>
        <View accessibilityRole="radiogroup" className="flex-row gap-2">
          {GEOFENCE_RADIUS_CHOICES.map((choice) => {
            const isSelected = settings.geofenceRadiusMeters === choice.meters;
            return (
              <View key={choice.meters} className="flex-1">
                <PressableScale
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected, disabled: !isEditable }}
                  accessibilityLabel={`${choice.label}, ${choice.meters} metres. ${choice.hint}`}
                  disabled={!isEditable}
                  onPress={() =>
                    setSettings((current) => ({ ...current, geofenceRadiusMeters: choice.meters }))
                  }
                  className={cn(
                    'min-h-12 items-center gap-1 rounded-md border-2 bg-surface px-2 py-3',
                    isSelected ? 'border-primary' : 'border-border',
                  )}
                >
                  <Text variant="label" className={isSelected ? 'text-primary' : undefined}>
                    {choice.label}
                  </Text>
                  <Text variant="caption" className="text-xs">
                    {choice.meters} m
                  </Text>
                </PressableScale>
              </View>
            );
          })}
        </View>
      </View>

      {isEditable && (
        <Button label="Save" onPress={save} isLoading={updateProofSettings.isPending} />
      )}
    </View>
  );
}
