import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';

export interface FormActionsProps {
  saveLabel: string;
  errorMessage: string | null;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function FormActions({
  saveLabel,
  errorMessage,
  isSaving,
  onSave,
  onCancel,
}: FormActionsProps) {
  return (
    <View className="gap-3">
      {errorMessage && <FormMessage message={errorMessage} />}
      <View className="flex-row gap-2">
        <Button label={saveLabel} onPress={onSave} isLoading={isSaving} className="flex-1" />
        <Button label="Cancel" variant="ghost" onPress={onCancel} />
      </View>
    </View>
  );
}
