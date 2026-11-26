import { patientContactSchema } from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { ApiError } from '@/lib/api-client';
import { useUpdatePatientPhone } from '../hooks/use-daily-call';

export interface PatientPhoneFormProps {
  patientId: string;
  patientFirstName: string;
}

export function PatientPhoneForm({ patientId, patientFirstName }: PatientPhoneFormProps) {
  const [phone, setPhone] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const updatePhone = useUpdatePatientPhone(patientId);

  const save = () => {
    const parsed = patientContactSchema.safeParse({ phone });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    setFieldError(undefined);
    updatePhone.mutate(parsed.data.phone);
  };

  const serverError = updatePhone.error instanceof ApiError ? updatePhone.error.message : undefined;

  return (
    <View className="gap-3">
      <TextField
        label={`${patientFirstName}'s phone number`}
        value={phone}
        onChangeText={setPhone}
        errorMessage={fieldError ?? serverError}
        placeholder="0803 555 0101"
        keyboardType="phone-pad"
        autoComplete="tel"
      />
      <Button
        label="Save number"
        variant="secondary"
        onPress={save}
        isLoading={updatePhone.isPending}
      />
    </View>
  );
}
