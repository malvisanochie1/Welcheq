import { passwordResetRequestSchema } from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { TextField } from '@/components/ui/TextField';
import { AuthError, requestPasswordReset } from '../api/auth.api';

const SENT_MESSAGE =
  'If that email has an account, a link to choose a new password is on its way. It can take a few minutes.';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const parsed = passwordResetRequestSchema.safeParse({ email });
    setFormError(null);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    setFieldError(undefined);
    setIsSubmitting(true);
    try {
      await requestPasswordReset(parsed.data.email);
      setIsSent(true);
    } catch (error) {
      setFormError(error instanceof AuthError ? error.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="gap-5">
      {formError && <FormMessage message={formError} />}
      {isSent && <FormMessage tone="info" message={SENT_MESSAGE} />}
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        errorMessage={fieldError}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        onSubmitEditing={submit}
      />
      <Button
        label={isSent ? 'Send again' : 'Send reset link'}
        onPress={submit}
        isLoading={isSubmitting}
      />
    </View>
  );
}
