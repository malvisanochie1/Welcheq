import { acceptInvitationSchema, formatInvitationCode, INVITATION_CODE } from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { TextField } from '@/components/ui/TextField';
import { ApiError } from '@/lib/api-client';
import { homeDisplayApi } from '../api/home-display.api';
import { useHomeDisplayStore } from '../stores/home-display.store';

export function PairDisplayForm() {
  const pair = useHomeDisplayStore((state) => state.pair);
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPairing, setIsPairing] = useState(false);

  const submit = async () => {
    const parsed = acceptInvitationSchema.safeParse({ code });
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? 'Check the code and try again');
      return;
    }

    setErrorMessage(null);
    setIsPairing(true);
    try {
      const result = await homeDisplayApi.pair({ code: parsed.data.code });
      await pair({ patientFirstName: result.patientFirstName, secret: result.secret });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Please try again.');
    } finally {
      setIsPairing(false);
    }
  };

  return (
    <View className="gap-6">
      {errorMessage && <FormMessage message={errorMessage} />}
      <TextField
        label="Setup code"
        value={code}
        onChangeText={(text) => setCode(formatInvitationCode(text))}
        placeholder="ABCD-2345"
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={INVITATION_CODE.LENGTH + 1}
        onSubmitEditing={submit}
      />
      <Button label="Start showing codes" onPress={submit} isLoading={isPairing} />
    </View>
  );
}
