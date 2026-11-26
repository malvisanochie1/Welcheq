import { PASSWORD_RULES, signUpSchema, type SignUpInput } from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { TextField } from '@/components/ui/TextField';
import { toFieldErrors, type FieldErrors } from '@/lib/form-errors';
import { AuthError, signUpWithPassword } from '../api/auth.api';
import { PasswordVisibilityToggle } from './PasswordVisibilityToggle';

const EMPTY_FORM: SignUpInput = { email: '', password: '' };

const CONFIRM_EMAIL_MESSAGE =
  'Check your inbox and open the link we sent to confirm your email, then sign in.';

export function SignUpForm() {
  const [values, setValues] = useState<SignUpInput>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<keyof SignUpInput>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof SignUpInput) => (text: string) =>
    setValues((current) => ({ ...current, [field]: text }));

  const submit = async () => {
    const parsed = signUpSchema.safeParse(values);
    setFormError(null);
    setNotice(null);

    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const outcome = await signUpWithPassword(parsed.data);
      if (outcome === 'confirm-email') {
        setNotice(CONFIRM_EMAIL_MESSAGE);
      }
    } catch (error) {
      setFormError(error instanceof AuthError ? error.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="gap-5">
      {formError && <FormMessage message={formError} />}
      {notice && <FormMessage message={notice} tone="info" />}
      <TextField
        label="Email"
        value={values.email}
        onChangeText={updateField('email')}
        errorMessage={fieldErrors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        label="Password"
        value={values.password}
        onChangeText={updateField('password')}
        errorMessage={fieldErrors.password}
        placeholder={`At least ${PASSWORD_RULES.MIN_LENGTH} characters`}
        secureTextEntry={!isPasswordVisible}
        autoComplete="new-password"
        textContentType="newPassword"
        onSubmitEditing={submit}
        trailing={
          <PasswordVisibilityToggle
            isVisible={isPasswordVisible}
            onToggle={() => setIsPasswordVisible((visible) => !visible)}
          />
        }
      />
      <Button label="Create account" onPress={submit} isLoading={isSubmitting} />
    </View>
  );
}
