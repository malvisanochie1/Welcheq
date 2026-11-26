import { useState } from 'react';

import { ConfirmButton } from '@/components/ui/ConfirmButton';
import { healthProfileApi, type Condition } from '../api/health-profile.api';
import { useHealthProfileChange } from '../hooks/use-health-profile';
import { ConditionForm } from './ConditionForm';
import { EntryRow } from './EntryRow';
import { HealthSection } from './HealthSection';

export interface ConditionsSectionProps {
  patientId: string;
  conditions: Condition[];
  canEdit: boolean;
}

export function ConditionsSection({ patientId, conditions, canEdit }: ConditionsSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const remove = useHealthProfileChange(patientId, (id: string) =>
    healthProfileApi.removeCondition(patientId, id),
  );

  return (
    <HealthSection
      title="Conditions"
      emptyMessage="No long-term conditions recorded."
      isEmpty={conditions.length === 0}
      addLabel="Add"
      onAdd={canEdit ? () => setIsAdding(true) : undefined}
      form={isAdding && <ConditionForm patientId={patientId} onDone={() => setIsAdding(false)} />}
    >
      {conditions.map((condition, index) => (
        <EntryRow
          key={condition.id}
          isFirst={index === 0}
          title={condition.name}
          details={[
            condition.diagnosedOn ? `Since ${condition.diagnosedOn.slice(0, 4)}` : null,
            condition.notes,
          ]}
          actions={
            canEdit && (
              <ConfirmButton
                label="Remove"
                confirmLabel={`Remove ${condition.name}`}
                onConfirm={() => remove.mutate(condition.id)}
                isLoading={remove.isPending}
              />
            )
          }
        />
      ))}
    </HealthSection>
  );
}
