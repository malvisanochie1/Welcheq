import { useState } from 'react';
import { View } from 'react-native';

import { Button } from './Button';

export interface ConfirmButtonProps {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

/** A destructive action that needs a second tap, so nothing is removed by accident. */
export function ConfirmButton({ label, confirmLabel, onConfirm, isLoading }: ConfirmButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isConfirming) {
    return <Button label={label} variant="ghost" onPress={() => setIsConfirming(true)} />;
  }
  return (
    <View className="flex-row flex-wrap gap-2">
      <Button label={confirmLabel} variant="secondary" onPress={onConfirm} isLoading={isLoading} />
      <Button label="Keep it" variant="ghost" onPress={() => setIsConfirming(false)} />
    </View>
  );
}
