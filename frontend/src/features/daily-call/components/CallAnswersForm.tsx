import { CALL_OUTCOME, type CallAnswer } from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { FormMessage } from '@/components/ui/FormMessage';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { CALL_ANSWER_OPTIONS } from '@/config/daily-call';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import type { DailyCallPlan, RecordedCall } from '../api/daily-call.api';
import { useRecordDailyCall } from '../hooks/use-daily-call';

export interface CallAnswersFormProps {
  patientId: string;
  plan: DailyCallPlan;
  onRecorded: (call: RecordedCall) => void;
  onRemindLater: () => void;
}

const questionKey = (index: number) => String(index);

export function CallAnswersForm({
  patientId,
  plan,
  onRecorded,
  onRemindLater,
}: CallAnswersFormProps) {
  const recordCall = useRecordDailyCall(patientId);
  const [answers, setAnswers] = useState<Record<string, CallAnswer>>({});
  const [note, setNote] = useState('');
  const [isIncomplete, setIsIncomplete] = useState(false);

  const save = (outcome: typeof CALL_OUTCOME.REACHED | typeof CALL_OUTCOME.UNREACHABLE) => {
    const isReached = outcome === CALL_OUTCOME.REACHED;
    if (isReached && Object.keys(answers).length < plan.questions.length) {
      setIsIncomplete(true);
      return;
    }
    setIsIncomplete(false);
    recordCall.mutate(
      {
        date: plan.date,
        outcome,
        note: note.trim() || undefined,
        answers: isReached
          ? plan.questions.map((question, index) => ({
              kind: question.kind,
              taskId: question.taskId,
              answer: answers[questionKey(index)] as CallAnswer,
            }))
          : [],
      },
      { onSuccess: onRecorded },
    );
  };

  const errorMessage =
    recordCall.error instanceof ApiError
      ? recordCall.error.message
      : recordCall.error && 'Please try again.';

  return (
    <View className="gap-6">
      {errorMessage && <FormMessage message={errorMessage} />}

      <View className="rounded-lg border border-border bg-surface px-4">
        {plan.questions.map((question, index) => (
          <View
            key={question.taskId ?? question.kind}
            className={cn('gap-3 py-4', index > 0 && 'border-t border-border')}
          >
            <Text variant="label" className="text-base">
              {question.title}
            </Text>
            <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
              {CALL_ANSWER_OPTIONS.map((option) => (
                <Chip
                  key={option.answer}
                  role="radio"
                  label={option.label}
                  isSelected={answers[questionKey(index)] === option.answer}
                  onPress={() =>
                    setAnswers((current) => ({ ...current, [questionKey(index)]: option.answer }))
                  }
                />
              ))}
            </View>
          </View>
        ))}
      </View>

      <TextField
        label="Anything else they mentioned (optional)"
        value={note}
        onChangeText={setNote}
        placeholder="Knee pain in the mornings"
        multiline
      />

      {isIncomplete && <FormMessage message="Answer each question, or choose Not sure." />}
      <View className="gap-2">
        <Button
          label="Save answers"
          onPress={() => save(CALL_OUTCOME.REACHED)}
          isLoading={recordCall.isPending}
        />
        <Button
          label={`Couldn't reach ${plan.patientFirstName}`}
          variant="secondary"
          onPress={() => save(CALL_OUTCOME.UNREACHABLE)}
        />
        <Button label="Remind me later" variant="ghost" onPress={onRemindLater} />
      </View>
    </View>
  );
}
