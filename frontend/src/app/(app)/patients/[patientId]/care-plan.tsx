import { CARE_RELATIONSHIP } from '@welcheq/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { View } from 'react-native';

import { ErrorState } from '@/components/layout/ErrorState';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { CATEGORY_DETAILS, WEEKDAY_SHORT_LABELS } from '@/config/care-plan';
import { TemplatePicker } from '@/features/care-plan/components/TemplatePicker';
import { useCareTasks } from '@/features/care-plan/hooks/use-care-plan';
import { usePatient } from '@/features/patients/hooks/use-patients';
import { cn } from '@/lib/cn';
import { palette } from '@/theme';

const ICON_SIZE = 20;
const SKELETON_HEIGHT = 240;

const describeDays = (days: number[]) =>
  days.length === 0 ? 'Every day' : days.map((day) => WEEKDAY_SHORT_LABELS[day]).join(', ');

export default function CarePlanScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const patient = usePatient(patientId);
  const tasks = useCareTasks(patientId);
  const isOwner = patient.data?.relationship === CARE_RELATIONSHIP.OWNER;

  if (tasks.isError) {
    return (
      <ErrorState
        title="We couldn't load the care plan"
        message={tasks.error.message}
        onRetry={() => tasks.refetch()}
      />
    );
  }

  const editTask = (taskId?: string) =>
    router.push({
      pathname: '/patients/[patientId]/care-task',
      params: taskId ? { patientId, taskId } : { patientId },
    });

  return (
    <Screen contentClassName="gap-6">
      <ScreenHeader
        canGoBack
        title="Care plan"
        subtitle={patient.data ? `${patient.data.fullName}'s daily routine` : 'The daily routine'}
      />

      {!tasks.data ? (
        <Skeleton height={SKELETON_HEIGHT} />
      ) : tasks.data.length === 0 && isOwner ? (
        <View className="gap-6">
          <TemplatePicker patientId={patientId} />
          <Button label="Or add tasks one by one" variant="ghost" onPress={() => editTask()} />
        </View>
      ) : (
        <View className="gap-4">
          <View className="rounded-lg border border-border bg-surface px-4">
            {tasks.data.map((task, index) => {
              const category = CATEGORY_DETAILS[task.category];
              const Icon = category.icon;
              return (
                <PressableScale
                  key={task.id}
                  accessibilityRole={isOwner ? 'button' : undefined}
                  accessibilityHint={isOwner ? 'Edit this task' : undefined}
                  disabled={!isOwner}
                  onPress={() => editTask(task.id)}
                  className={cn(
                    'flex-row items-center gap-3 py-4',
                    index > 0 && 'border-t border-border',
                  )}
                >
                  <Icon size={ICON_SIZE} color={palette.primary} />
                  <View className="flex-1 gap-1">
                    <Text variant="label" className="text-base">
                      {task.title}
                    </Text>
                    <Text variant="caption">
                      {task.time} · {describeDays(task.daysOfWeek)}
                    </Text>
                  </View>
                  {isOwner && <ChevronRight size={ICON_SIZE} color={palette['ink-subtle']} />}
                </PressableScale>
              );
            })}
          </View>
          {isOwner && <Button label="Add a task" variant="secondary" onPress={() => editTask()} />}
        </View>
      )}
    </Screen>
  );
}
