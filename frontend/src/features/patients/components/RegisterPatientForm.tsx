import { createPatientSchema } from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { TextField } from '@/components/ui/TextField';
import { ApiError } from '@/lib/api-client';
import { toFieldErrors, type FieldErrors } from '@/lib/form-errors';
import type { Patient } from '../api/patients.api';
import { useHomeLocation } from '../hooks/use-home-location';
import { useCreatePatient } from '../hooks/use-patients';
import { HomeLocationPicker } from './HomeLocationPicker';

interface Draft {
  fullName: string;
  dateOfBirth: string;
  homeAddress: string;
}

type DraftField = keyof Draft | 'homeLocation';

const HOME_LOCATION_REQUIRED = 'Set the home location to continue.';

const EMPTY_DRAFT: Draft = { fullName: '', dateOfBirth: '', homeAddress: '' };

export interface RegisterPatientFormProps {
  onRegistered: (patient: Patient) => void;
}

export function RegisterPatientForm({ onRegistered }: RegisterPatientFormProps) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<DraftField>>({});
  const homeLocation = useHomeLocation();
  const createPatient = useCreatePatient();

  const updateField = (field: keyof Draft) => (text: string) =>
    setDraft((current) => ({ ...current, [field]: text }));

  const submit = () => {
    const parsed = createPatientSchema.safeParse({
      fullName: draft.fullName,
      homeAddress: draft.homeAddress,
      dateOfBirth: draft.dateOfBirth.trim() || undefined,
      homeLocation: homeLocation.location
        ? { latitude: homeLocation.location.latitude, longitude: homeLocation.location.longitude }
        : undefined,
    });

    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }

    setFieldErrors({});
    createPatient.mutate(parsed.data, { onSuccess: onRegistered });
  };

  const submitError =
    createPatient.error instanceof ApiError
      ? createPatient.error.message
      : createPatient.error && 'Please try again.';

  return (
    <View className="gap-6">
      {submitError && <FormMessage message={submitError} />}

      <TextField
        label="Their full name"
        value={draft.fullName}
        onChangeText={updateField('fullName')}
        errorMessage={fieldErrors.fullName}
        autoCapitalize="words"
        placeholder="Ngozi Okafor"
      />
      <TextField
        label="Date of birth (optional)"
        value={draft.dateOfBirth}
        onChangeText={updateField('dateOfBirth')}
        errorMessage={fieldErrors.dateOfBirth}
        placeholder="YYYY-MM-DD"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />
      <TextField
        label="Home address"
        value={draft.homeAddress}
        onChangeText={updateField('homeAddress')}
        errorMessage={fieldErrors.homeAddress}
        placeholder="12 Ogui Road, Enugu"
        autoCapitalize="words"
        multiline
      />

      <HomeLocationPicker
        location={homeLocation.location}
        errorMessage={
          homeLocation.errorMessage ?? (fieldErrors.homeLocation ? HOME_LOCATION_REQUIRED : null)
        }
        isLocating={homeLocation.isLocating}
        canFindAddress={homeLocation.canFindAddress}
        onUseCurrentPosition={homeLocation.captureCurrentPosition}
        onFindAddress={() => homeLocation.findAddress(draft.homeAddress)}
      />

      <Button label="Save" onPress={submit} isLoading={createPatient.isPending} />
    </View>
  );
}
