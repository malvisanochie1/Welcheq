import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { CareTaskForm } from '@/features/care-plan/components/CareTaskForm';
import {
  useAddCareTask,
  useCareTasks,
  useRemoveCareTask,
  useUpdateCareTask,
} from '@/features/care-plan/hooks/use-care-plan';

const SKELETON_HEIGHT = 400;

export default function CareTaskScreen() {
  const { patientId, taskId } = useLocalSearchParams<{ patientId: string; taskId?: string }>();
  const tasks = useCareTasks(patientId);
  const addTask = useAddCareTask(patientId);
  const updateTask = useUpdateCareTask(patientId, taskId ?? '');
  const removeTask = useRemoveCareTask(patientId);
  const [isConfirmingRemoval, setIsConfirmingRemoval] = useState(false);

  const existingTask = taskId ? tasks.data?.find((task) => task.id === taskId) : undefined;
  const isEditing = Boolean(taskId);
  const mutation = isEditing ? updateTask : addTask;

  return (
    <Screen contentClassName="gap-8">
      <ScreenHeader canGoBack title={isEditing ? 'Edit task' : 'Add a task'} />

      {isEditing && !existingTask ? (
        <Skeleton height={SKELETON_HEIGHT} />
      ) : (
        <CareTaskForm
          initialTask={existingTask}
          isSaving={mutation.isPending}
          error={mutation.error}
          onSubmit={(input) => mutation.mutate(input, { onSuccess: () => router.back() })}
        />
      )}

      {existingTask &&
        (isConfirmingRemoval ? (
          <View className="gap-3 rounded-md bg-danger-soft p-4">
            <Text variant="label" className="text-danger">
              Remove "{existingTask.title}" from the plan? Past records are kept.
            </Text>
            <Button
              label="Remove task"
              onPress={() => removeTask.mutate(existingTask.id, { onSuccess: () => router.back() })}
              isLoading={removeTask.isPending}
            />
            <Button
              label="Keep it"
              variant="secondary"
              onPress={() => setIsConfirmingRemoval(false)}
            />
          </View>
        ) : (
          <Button
            label="Remove task"
            variant="ghost"
            onPress={() => setIsConfirmingRemoval(true)}
          />
        ))}
    </Screen>
  );
}
