import { signInSchema, type SignInInput } from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { TextField } from '@/components/ui/TextField';
import { toFieldErrors, type FieldErrors } from '@/lib/form-errors';
import { AuthError, signInWithPassword } from '../api/auth.api';
import { PasswordVisibilityToggle } from './PasswordVisibilityToggle';

const EMPTY_FORM: SignInInput = { email: '', password: '' };

export function SignInForm() {
  const [values, setValues] = useState<SignInInput>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<keyof SignInInput>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof SignInInput) => (text: string) =>
    setValues((current) => ({ ...current, [field]: text }));

  const submit = async () => {
    const parsed = signInSchema.safeParse(values);
    setFormError(null);

    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await signInWithPassword(parsed.data);
    } catch (error) {
      setFormError(error instanceof AuthError ? error.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="gap-5">
      {formError && <FormMessage message={formError} />}
      <TextField
        label="Email"
        value={values.email}
        onChangeText={updateField('email')}
        errorMessage={fieldErrors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
      />
      <TextField
        label="Password"
        value={values.password}
        onChangeText={updateField('password')}
        errorMessage={fieldErrors.password}
        secureTextEntry={!isPasswordVisible}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        trailing={
          <PasswordVisibilityToggle
            isVisible={isPasswordVisible}
            onToggle={() => setIsPasswordVisible((visible) => !visible)}
          />
        }
      />
      <Button label="Sign in" onPress={submit} isLoading={isSubmitting} />
    </View>
  );
}
