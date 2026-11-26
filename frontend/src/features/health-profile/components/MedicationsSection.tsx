import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ConfirmButton } from '@/components/ui/ConfirmButton';
import { Text } from '@/components/ui/Text';
import { formatShortDate } from '@/lib/format-date';
import { healthProfileApi, type Medication } from '../api/health-profile.api';
import { useHealthProfileChange } from '../hooks/use-health-profile';
import { EntryRow } from './EntryRow';
import { HealthSection } from './HealthSection';
import { MedicationForm } from './MedicationForm';

export interface MedicationsSectionProps {
  patientId: string;
  medications: Medication[];
  canEdit: boolean;
}

export function MedicationsSection({ patientId, medications, canEdit }: MedicationsSectionProps) {
  const [editing, setEditing] = useState<Medication | 'new' | null>(null);
  const [showStopped, setShowStopped] = useState(false);
  const stop = useHealthProfileChange(patientId, (id: string) =>
    healthProfileApi.stopMedication(patientId, id),
  );
  const current = medications.filter((medication) => !medication.stoppedAt);
  const stopped = medications.filter((medication) => medication.stoppedAt);

  return (
    <View className="gap-3">
      <HealthSection
        title="Current medicines"
        emptyMessage="No medicines recorded."
        isEmpty={current.length === 0}
        addLabel="Add"
        onAdd={canEdit ? () => setEditing('new') : undefined}
        form={
          editing && (
            <MedicationForm
              patientId={patientId}
              existing={editing === 'new' ? undefined : editing}
              onDone={() => setEditing(null)}
            />
          )
        }
      >
        {current.map((medication, index) => (
          <EntryRow
            key={medication.id}
            isFirst={index === 0}
            title={[medication.name, medication.dose].filter(Boolean).join(' · ')}
            details={[medication.instructions, `Added by ${medication.addedBy}`]}
            actions={
              canEdit && (
                <View className="flex-row flex-wrap gap-2">
                  <Button label="Edit" variant="ghost" onPress={() => setEditing(medication)} />
                  <ConfirmButton
                    label="Stopped taking it"
                    confirmLabel={`Mark ${medication.name} as stopped`}
                    onConfirm={() => stop.mutate(medication.id)}
                    isLoading={stop.isPending}
                  />
                </View>
              )
            }
          />
        ))}
      </HealthSection>

      {stopped.length > 0 && (
        <View className="gap-3">
          <Button
            label={showStopped ? 'Hide past medicines' : `Past medicines (${stopped.length})`}
            variant="ghost"
            onPress={() => setShowStopped((value) => !value)}
          />
          {showStopped && (
            <View className="rounded-lg border border-border bg-surface px-4">
              {stopped.map((medication, index) => (
                <EntryRow
                  key={medication.id}
                  isFirst={index === 0}
                  isMuted
                  title={[medication.name, medication.dose].filter(Boolean).join(' · ')}
                  details={[
                    medication.stoppedAt
                      ? `Stopped ${formatShortDate(medication.stoppedAt)}`
                      : null,
                  ]}
                />
              ))}
            </View>
          )}
          {!showStopped && (
            <Text variant="caption">Stopped medicines are kept so the history stays complete.</Text>
          )}
        </View>
      )}
    </View>
  );
}
