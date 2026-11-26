import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { ConfirmButton } from '@/components/ui/ConfirmButton';
import { ALLERGY_SEVERITY_DETAILS } from '@/config/health-profile';
import { healthProfileApi, type Allergy } from '../api/health-profile.api';
import { useHealthProfileChange } from '../hooks/use-health-profile';
import { AllergyForm } from './AllergyForm';
import { EntryRow } from './EntryRow';
import { HealthSection } from './HealthSection';

export interface AllergiesSectionProps {
  patientId: string;
  allergies: Allergy[];
  canEdit: boolean;
}

export function AllergiesSection({ patientId, allergies, canEdit }: AllergiesSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const remove = useHealthProfileChange(patientId, (id: string) =>
    healthProfileApi.removeAllergy(patientId, id),
  );

  return (
    <HealthSection
      title="Allergies"
      emptyMessage="No known allergies recorded."
      isEmpty={allergies.length === 0}
      addLabel="Add"
      onAdd={canEdit ? () => setIsAdding(true) : undefined}
      form={isAdding && <AllergyForm patientId={patientId} onDone={() => setIsAdding(false)} />}
    >
      {allergies.map((allergy, index) => (
        <EntryRow
          key={allergy.id}
          isFirst={index === 0}
          title={allergy.substance}
          details={[allergy.reaction]}
          accessory={<Badge tone={ALLERGY_SEVERITY_DETAILS[allergy.severity]} />}
          actions={
            canEdit && (
              <ConfirmButton
                label="Remove"
                confirmLabel={`Remove ${allergy.substance}`}
                onConfirm={() => remove.mutate(allergy.id)}
                isLoading={remove.isPending}
              />
            )
          }
        />
      ))}
    </HealthSection>
  );
}
