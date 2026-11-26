import { completeProfileSchema, type CompleteProfileInput } from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { SIGN_UP_ROLE_OPTIONS } from '@/config/roles';
import { ApiError } from '@/lib/api-client';
import { toFieldErrors, type FieldErrors } from '@/lib/form-errors';
import { useCompleteProfile } from '../hooks/use-own-profile';
import { RoleOptionCard } from './RoleOptionCard';

type ProfileDraft = { fullName: string; phone: string; role: CompleteProfileInput['role'] | null };

const EMPTY_DRAFT: ProfileDraft = { fullName: '', phone: '', role: null };

export function ProfileSetupForm() {
  const [draft, setDraft] = useState<ProfileDraft>(EMPTY_DRAFT);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<keyof ProfileDraft>>({});
  const completeProfile = useCompleteProfile();

  const submit = () => {
    const parsed = completeProfileSchema.safeParse({
      fullName: draft.fullName,
      role: draft.role ?? undefined,
      phone: draft.phone.trim() || undefined,
    });

    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }

    setFieldErrors({});
    completeProfile.mutate(parsed.data);
  };

  const submitError =
    completeProfile.error instanceof ApiError
      ? completeProfile.error.message
      : completeProfile.error && 'Please try again.';

  return (
    <View className="gap-6">
      {submitError && <FormMessage message={submitError} />}

      <View accessibilityRole="radiogroup" className="gap-3">
        <Text variant="label">How will you use Welcheq?</Text>
        {SIGN_UP_ROLE_OPTIONS.map((option) => (
          <RoleOptionCard
            key={option.role}
            option={option}
            isSelected={draft.role === option.role}
            onSelect={() => setDraft((current) => ({ ...current, role: option.role }))}
          />
        ))}
        {fieldErrors.role && (
          <Text variant="caption" className="text-danger">
            Choose how you will use Welcheq
          </Text>
        )}
      </View>

      <TextField
        label="Full name"
        value={draft.fullName}
        onChangeText={(fullName) => setDraft((current) => ({ ...current, fullName }))}
        errorMessage={fieldErrors.fullName}
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
      />
      <TextField
        label="Phone number (optional)"
        value={draft.phone}
        onChangeText={(phone) => setDraft((current) => ({ ...current, phone }))}
        errorMessage={fieldErrors.phone}
        placeholder="+234 801 234 5678"
        autoComplete="tel"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
      />

      <Button label="Continue" onPress={submit} isLoading={completeProfile.isPending} />
    </View>
  );
}
