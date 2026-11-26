import { REPORT_RULES, type ReadingType, type Wellbeing } from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { TextField } from '@/components/ui/TextField';
import { ApiError } from '@/lib/api-client';
import type { VisitReport } from '../api/health-records.api';
import { useSaveVisitReport } from '../hooks/use-health-records';
import { collectReadings } from '../lib/collect-readings';
import type { ReadingDraft } from '../lib/reading-draft';
import { ReadingsEditor } from './ReadingsEditor';
import { WellbeingPicker } from './WellbeingPicker';

export interface VisitReportFormProps {
  patientId: string;
  visitId: string;
  patientFirstName: string;
  existing: VisitReport['report'];
  onSaved: () => void;
}

export function VisitReportForm({
  patientId,
  visitId,
  patientFirstName,
  existing,
  onSaved,
}: VisitReportFormProps) {
  const saveReport = useSaveVisitReport(patientId, visitId);
  const [wellbeing, setWellbeing] = useState<Wellbeing | null>(existing?.wellbeing ?? null);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [drafts, setDrafts] = useState<ReadingDraft[]>([]);
  const [readingErrors, setReadingErrors] = useState<Partial<Record<ReadingType, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const submit = () => {
    if (!wellbeing) {
      setFormError(`Choose how ${patientFirstName} was today.`);
      return;
    }
    const { readings, errors } = collectReadings(drafts);
    setReadingErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError('Check the readings above.');
      return;
    }
    setFormError(null);
    saveReport.mutate(
      { wellbeing, notes: notes.trim() || undefined, readings },
      {
        onSuccess: () => {
          setDrafts([]);
          onSaved();
        },
      },
    );
  };

  const apiError =
    saveReport.error instanceof ApiError
      ? saveReport.error.message
      : saveReport.error && 'Please try again.';
  const message = formError ?? apiError;

  return (
    <View className="gap-6">
      <WellbeingPicker
        patientFirstName={patientFirstName}
        value={wellbeing}
        onChange={setWellbeing}
      />
      <TextField
        label="Notes for the family (optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Ate well, walked to the gate, a little tired after lunch."
        maxLength={REPORT_RULES.NOTES_MAX_LENGTH}
        multiline
      />
      <ReadingsEditor drafts={drafts} errors={readingErrors} onChange={setDrafts} />
      {message && <FormMessage message={message} />}
      <Button
        label={existing ? 'Update report' : 'Save report'}
        onPress={submit}
        isLoading={saveReport.isPending}
      />
    </View>
  );
}
