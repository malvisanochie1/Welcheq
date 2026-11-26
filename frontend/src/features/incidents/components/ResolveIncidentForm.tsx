import { REPORT_RULES, resolveIncidentSchema } from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { TextField } from '@/components/ui/TextField';
import { ApiError } from '@/lib/api-client';
import { useResolveIncident } from '../hooks/use-incidents';

export interface ResolveIncidentFormProps {
  patientId: string;
  incidentId: string;
  onCancel: () => void;
}

export function ResolveIncidentForm({ patientId, incidentId, onCancel }: ResolveIncidentFormProps) {
  const resolveIncident = useResolveIncident(patientId);
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const submit = () => {
    const parsed = resolveIncidentSchema.safeParse({ resolutionNote: note });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Say how it was handled.');
      return;
    }
    setFormError(null);
    resolveIncident.mutate({ incidentId, resolutionNote: parsed.data.resolutionNote });
  };

  const apiError =
    resolveIncident.error instanceof ApiError
      ? resolveIncident.error.message
      : resolveIncident.error && 'Please try again.';
  const message = formError ?? apiError;

  return (
    <View className="gap-3">
      <TextField
        label="How was it handled?"
        value={note}
        onChangeText={setNote}
        placeholder="Seen by Dr Obi, no fracture. Non-slip mat ordered."
        maxLength={REPORT_RULES.NOTES_MAX_LENGTH}
        multiline
      />
      {message && <FormMessage message={message} />}
      <View className="flex-row gap-2">
        <Button
          label="Mark resolved"
          onPress={submit}
          isLoading={resolveIncident.isPending}
          className="flex-1"
        />
        <Button label="Cancel" variant="ghost" onPress={onCancel} />
      </View>
    </View>
  );
}
