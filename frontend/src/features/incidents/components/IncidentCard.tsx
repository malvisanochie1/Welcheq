import { INCIDENT_CATEGORY_LABELS, INCIDENT_STATUS } from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { INCIDENT_SEVERITY_DETAILS } from '@/config/incidents';
import { cn } from '@/lib/cn';
import { formatDay, formatTime } from '@/lib/format-date';
import type { Incident } from '../api/incidents.api';
import { ResolveIncidentForm } from './ResolveIncidentForm';

const RESOLVED_TONE = {
  label: 'Resolved',
  containerClassName: 'bg-success-soft',
  textClassName: 'text-success',
};

export interface IncidentCardProps {
  patientId: string;
  incident: Incident;
  canResolve: boolean;
}

export function IncidentCard({ patientId, incident, canResolve }: IncidentCardProps) {
  const [isResolving, setIsResolving] = useState(false);
  const isOpen = incident.status === INCIDENT_STATUS.OPEN;

  return (
    <View
      className={cn(
        'gap-3 rounded-lg border border-border bg-surface p-4',
        !isOpen && 'opacity-80',
      )}
    >
      <View className="flex-row items-start gap-3">
        <View className="flex-1 gap-1">
          <Text variant="label" className="text-base">
            {INCIDENT_CATEGORY_LABELS[incident.category]}
          </Text>
          <Text variant="caption">
            {formatDay(incident.occurredAt)} at {formatTime(incident.occurredAt)} · reported by{' '}
            {incident.reportedBy}
          </Text>
        </View>
        <Badge tone={isOpen ? INCIDENT_SEVERITY_DETAILS[incident.severity] : RESOLVED_TONE} />
      </View>
      <Text variant="body">{incident.description}</Text>

      {!isOpen && incident.resolutionNote && (
        <View className="gap-1 rounded-md bg-surface-muted p-3">
          <Text variant="caption">
            Resolved by {incident.resolvedBy}
            {incident.resolvedAt ? ` · ${formatDay(incident.resolvedAt)}` : ''}
          </Text>
          <Text variant="body">{incident.resolutionNote}</Text>
        </View>
      )}

      {isOpen && canResolve && !isResolving && (
        <View className="self-start">
          <Button label="Resolve" variant="secondary" onPress={() => setIsResolving(true)} />
        </View>
      )}
      {isOpen && isResolving && (
        <ResolveIncidentForm
          patientId={patientId}
          incidentId={incident.id}
          onCancel={() => setIsResolving(false)}
        />
      )}
    </View>
  );
}
