import { newPasswordSchema, PASSWORD_RULES, type NewPasswordInput } from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { TextField } from '@/components/ui/TextField';
import { toFieldErrors, type FieldErrors } from '@/lib/form-errors';
import { AuthError, setNewPassword } from '../api/auth.api';
import { PasswordVisibilityToggle } from './PasswordVisibilityToggle';

const EMPTY_FORM: NewPasswordInput = { password: '', confirmation: '' };

export function NewPasswordForm({ onSaved }: { onSaved: () => void }) {
  const [values, setValues] = useState<NewPasswordInput>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<keyof NewPasswordInput>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof NewPasswordInput) => (text: string) =>
    setValues((current) => ({ ...current, [field]: text }));

  const submit = async () => {
    const parsed = newPasswordSchema.safeParse(values);
    setFormError(null);
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await setNewPassword(parsed.data.password);
      onSaved();
    } catch (error) {
      setFormError(error instanceof AuthError ? error.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggle = (
    <PasswordVisibilityToggle isVisible={isVisible} onToggle={() => setIsVisible((v) => !v)} />
  );

  return (
    <View className="gap-5">
      {formError && <FormMessage message={formError} />}
      <TextField
        label="New password"
        value={values.password}
        onChangeText={updateField('password')}
        errorMessage={fieldErrors.password}
        placeholder={`At least ${PASSWORD_RULES.MIN_LENGTH} characters`}
        secureTextEntry={!isVisible}
        autoComplete="new-password"
        textContentType="newPassword"
        trailing={toggle}
      />
      <TextField
        label="Type it again"
        value={values.confirmation}
        onChangeText={updateField('confirmation')}
        errorMessage={fieldErrors.confirmation}
        secureTextEntry={!isVisible}
        autoComplete="new-password"
        textContentType="newPassword"
        onSubmitEditing={submit}
      />
      <Button label="Save new password" onPress={submit} isLoading={isSubmitting} />
    </View>
  );
}
