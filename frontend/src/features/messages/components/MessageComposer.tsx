import { MESSAGE_RULES } from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { TextField } from '@/components/ui/TextField';
import { describeRequestError } from '@/lib/form-errors';
import { useSendMessage } from '../hooks/use-messages';

export function MessageComposer({ patientId }: { patientId: string }) {
  const send = useSendMessage(patientId);
  const [draft, setDraft] = useState('');
  const errorMessage = describeRequestError(send.error);

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    send.mutate(body, { onSuccess: () => setDraft('') });
  };

  return (
    <View className="gap-2">
      {errorMessage && <FormMessage message={errorMessage} />}
      <TextField
        label="Message the care team"
        value={draft}
        onChangeText={setDraft}
        placeholder="She asked for pepper soup tonight"
        maxLength={MESSAGE_RULES.BODY_MAX_LENGTH}
        multiline
      />
      <Button
        label="Send"
        onPress={submit}
        isLoading={send.isPending}
        isDisabled={draft.trim().length === 0}
      />
    </View>
  );
}
