import { useState } from 'react';
import { View } from 'react-native';

import { ConfirmButton } from '@/components/ui/ConfirmButton';
import { Text } from '@/components/ui/Text';
import { useCapabilities } from '@/features/capabilities/use-capabilities';
import { formatShortDate } from '@/lib/format-date';
import { healthProfileApi } from '../api/health-profile.api';
import { useHealthDocumentChange, useHealthDocuments } from '../hooks/use-health-profile';
import { AddDocumentForm } from './AddDocumentForm';
import { DocumentViewer } from './DocumentViewer';
import { EntryRow } from './EntryRow';
import { HealthSection } from './HealthSection';

export interface DocumentsSectionProps {
  patientId: string;
  canEdit: boolean;
}

export function DocumentsSection({ patientId, canEdit }: DocumentsSectionProps) {
  const capabilities = useCapabilities();
  const documents = useHealthDocuments(patientId);
  const [isAdding, setIsAdding] = useState(false);
  const remove = useHealthDocumentChange(patientId, (id: string) =>
    healthProfileApi.removeDocument(patientId, id),
  );
  const isAvailable = capabilities.data?.documents ?? false;
  const list = documents.data ?? [];

  return (
    <View className="gap-2">
      <HealthSection
        title="Documents"
        emptyMessage="Prescriptions, test results and letters from the doctor can be kept here."
        isEmpty={list.length === 0}
        addLabel="Add"
        onAdd={canEdit && isAvailable ? () => setIsAdding(true) : undefined}
        form={
          isAdding && <AddDocumentForm patientId={patientId} onDone={() => setIsAdding(false)} />
        }
      >
        {list.map((document, index) => (
          <EntryRow
            key={document.id}
            isFirst={index === 0}
            title={document.title}
            details={[`Added ${formatShortDate(document.createdAt)} by ${document.uploadedBy}`]}
            actions={
              <View className="gap-2">
                <DocumentViewer patientId={patientId} document={document} />
                {canEdit && (
                  <ConfirmButton
                    label="Remove"
                    confirmLabel={`Remove ${document.title}`}
                    onConfirm={() => remove.mutate(document.id)}
                    isLoading={remove.isPending}
                  />
                )}
              </View>
            }
          />
        ))}
      </HealthSection>
      {canEdit && capabilities.data && !isAvailable && (
        <Text variant="caption">Adding documents will be available soon.</Text>
      )}
    </View>
  );
}
