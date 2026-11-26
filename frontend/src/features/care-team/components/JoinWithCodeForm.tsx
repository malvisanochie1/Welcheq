import { acceptInvitationSchema, formatInvitationCode, INVITATION_CODE } from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { TextField } from '@/components/ui/TextField';
import { ApiError } from '@/lib/api-client';
import type { AcceptedInvitation } from '../api/care-team.api';
import { useAcceptInvitation } from '../hooks/use-care-team';

const FORMATTED_CODE_LENGTH = INVITATION_CODE.LENGTH + 1;

export interface JoinWithCodeFormProps {
  onJoined: (result: AcceptedInvitation) => void;
}

export function JoinWithCodeForm({ onJoined }: JoinWithCodeFormProps) {
  const [code, setCode] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const acceptInvitation = useAcceptInvitation();

  const submit = () => {
    const parsed = acceptInvitationSchema.safeParse({ code });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    setFieldError(undefined);
    acceptInvitation.mutate({ code: parsed.data.code }, { onSuccess: onJoined });
  };

  const errorMessage =
    acceptInvitation.error instanceof ApiError
      ? acceptInvitation.error.message
      : acceptInvitation.error && 'Please try again.';

  return (
    <View className="gap-6">
      {errorMessage && <FormMessage message={errorMessage} />}
      <TextField
        label="Invite code"
        value={code}
        onChangeText={(text) => setCode(formatInvitationCode(text))}
        errorMessage={fieldError}
        placeholder="ABCD-2345"
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={FORMATTED_CODE_LENGTH}
        onSubmitEditing={submit}
      />
      <Button label="Join" onPress={submit} isLoading={acceptInvitation.isPending} />
    </View>
  );
}
