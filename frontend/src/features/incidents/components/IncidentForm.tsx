import {
  INCIDENT_CATEGORY,
  INCIDENT_SEVERITY,
  incidentInputSchema,
  REPORT_RULES,
  type IncidentCategory,
  type IncidentSeverity,
} from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { FormMessage } from '@/components/ui/FormMessage';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import {
  INCIDENT_CATEGORY_LABELS,
  INCIDENT_SEVERITY_DETAILS,
  INCIDENT_TIMING_OPTIONS,
} from '@/config/incidents';
import { ApiError } from '@/lib/api-client';
import { useReportIncident } from '../hooks/use-incidents';

const HOUR_MS = 3_600_000;

export interface IncidentFormProps {
  patientId: string;
  onReported: () => void;
}

export function IncidentForm({ patientId, onReported }: IncidentFormProps) {
  const reportIncident = useReportIncident(patientId);
  const [category, setCategory] = useState<IncidentCategory | null>(null);
  const [severity, setSeverity] = useState<IncidentSeverity>(INCIDENT_SEVERITY.MEDIUM);
  const [hoursAgo, setHoursAgo] = useState(INCIDENT_TIMING_OPTIONS[0]?.hoursAgo ?? 0);
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const submit = () => {
    if (!category) {
      setFormError('Choose what happened.');
      return;
    }
    const parsed = incidentInputSchema.safeParse({
      category,
      severity,
      description,
      occurredAt: new Date(Date.now() - hoursAgo * HOUR_MS).toISOString(),
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Check the details.');
      return;
    }
    setFormError(null);
    reportIncident.mutate(parsed.data, { onSuccess: onReported });
  };

  const apiError =
    reportIncident.error instanceof ApiError
      ? reportIncident.error.message
      : reportIncident.error && 'Please try again.';
  const message = formError ?? apiError;

  return (
    <View className="gap-6">
      <View className="gap-3">
        <Text variant="label">What happened?</Text>
        <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
          {Object.values(INCIDENT_CATEGORY).map((option) => (
            <Chip
              key={option}
              role="radio"
              label={INCIDENT_CATEGORY_LABELS[option]}
              isSelected={category === option}
              onPress={() => setCategory(option)}
            />
          ))}
        </View>
      </View>
      <View className="gap-3">
        <Text variant="label">How serious is it?</Text>
        <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
          {Object.values(INCIDENT_SEVERITY).map((option) => (
            <Chip
              key={option}
              role="radio"
              label={INCIDENT_SEVERITY_DETAILS[option].label}
              isSelected={severity === option}
              onPress={() => setSeverity(option)}
            />
          ))}
        </View>
      </View>
      <View className="gap-3">
        <Text variant="label">When did it happen?</Text>
        <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
          {INCIDENT_TIMING_OPTIONS.map((option) => (
            <Chip
              key={option.label}
              role="radio"
              label={option.label}
              isSelected={hoursAgo === option.hoursAgo}
              onPress={() => setHoursAgo(option.hoursAgo)}
            />
          ))}
        </View>
      </View>
      <TextField
        label="Describe it"
        value={description}
        onChangeText={setDescription}
        placeholder="Slipped in the bathroom around 10am. Bruised left arm, no bleeding."
        maxLength={REPORT_RULES.NOTES_MAX_LENGTH}
        multiline
      />
      {message && <FormMessage message={message} />}
      <Button label="Report incident" onPress={submit} isLoading={reportIncident.isPending} />
    </View>
  );
}
