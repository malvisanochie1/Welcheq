import { CARE_PLAN_TEMPLATES } from '@welcheq/shared';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Text } from '@/components/ui/Text';
import { ApiError } from '@/lib/api-client';
import { useApplyTemplate } from '../hooks/use-care-plan';

export interface TemplatePickerProps {
  patientId: string;
}

export function TemplatePicker({ patientId }: TemplatePickerProps) {
  const applyTemplate = useApplyTemplate(patientId);
  const errorMessage =
    applyTemplate.error instanceof ApiError
      ? applyTemplate.error.message
      : applyTemplate.error && 'Please try again.';

  return (
    <View className="gap-4">
      <View className="gap-1">
        <Text variant="heading">Start from a ready-made routine</Text>
        <Text variant="caption">You can change or remove any task afterwards.</Text>
      </View>
      {errorMessage && <FormMessage message={errorMessage} />}
      {CARE_PLAN_TEMPLATES.map((template) => (
        <View key={template.id} className="gap-3 rounded-lg border border-border bg-surface p-4">
          <View className="gap-1">
            <Text variant="label" className="text-base">
              {template.name}
            </Text>
            <Text variant="caption">
              {template.description} {template.tasks.length} tasks.
            </Text>
          </View>
          <Button
            label="Use this routine"
            variant="secondary"
            onPress={() => applyTemplate.mutate(template.id)}
            isLoading={applyTemplate.isPending && applyTemplate.variables === template.id}
            isDisabled={applyTemplate.isPending}
          />
        </View>
      ))}
    </View>
  );
}
