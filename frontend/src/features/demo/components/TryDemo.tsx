import { useMutation } from '@tanstack/react-query';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Text } from '@/components/ui/Text';
import { useCapabilities } from '@/features/capabilities/use-capabilities';
import { describeRequestError } from '@/lib/form-errors';
import { DemoError, startDemo, type DemoPersona } from '../api/demo.api';

/** Lets anyone look around with realistic made-up data, without creating an account. */
export function TryDemo() {
  const capabilities = useCapabilities();
  const demo = useMutation({ mutationFn: (persona: DemoPersona) => startDemo(persona) });

  if (!capabilities.data?.demo) return null;

  const error =
    demo.error instanceof DemoError ? demo.error.message : describeRequestError(demo.error);
  const isStarting = (persona: DemoPersona) => demo.isPending && demo.variables === persona;

  return (
    <View className="gap-3 rounded-lg border border-border bg-surface p-4">
      <View className="gap-1">
        <Text variant="heading">Try the demo</Text>
        <Text variant="caption">
          Look around with made-up data. No account needed, and the first start can take a minute.
        </Text>
      </View>
      {error && <FormMessage message={error} />}
      <View className="flex-row flex-wrap gap-2">
        <View className="min-w-[45%] flex-1">
          <Button
            label="As a family"
            variant="secondary"
            onPress={() => demo.mutate('family')}
            isLoading={isStarting('family')}
          />
        </View>
        <View className="min-w-[45%] flex-1">
          <Button
            label="As a caregiver"
            variant="secondary"
            onPress={() => demo.mutate('caregiver')}
            isLoading={isStarting('caregiver')}
          />
        </View>
      </View>
    </View>
  );
}
