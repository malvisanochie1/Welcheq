import { addDays, CHECKLIST_STATUS } from '@welcheq/shared';
import { View } from 'react-native';

import { EmptyState } from '@/components/layout/EmptyState';
import { Chip } from '@/components/ui/Chip';
import { FormMessage } from '@/components/ui/FormMessage';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { ApiError } from '@/lib/api-client';
import { useChecklist, useRecordTask } from '../hooks/use-care-plan';
import { ChecklistItemRow } from './ChecklistItemRow';

const SKELETON_HEIGHT = 240;

export interface ChecklistViewProps {
  patientId: string;
  date?: string;
  onSelectDate: (date: string | undefined) => void;
}

export function ChecklistView({ patientId, date, onSelectDate }: ChecklistViewProps) {
  const checklist = useChecklist(patientId, date);
  const recordTask = useRecordTask(patientId, date);

  if (!checklist.data) {
    return <Skeleton height={SKELETON_HEIGHT} />;
  }

  const { items, canRecord, today } = checklist.data;
  const yesterday = addDays(today, -1);
  const isToday = (date ?? today) === today;
  const doneCount = items.filter((item) => item.status === CHECKLIST_STATUS.DONE).length;
  const errorMessage =
    recordTask.error instanceof ApiError
      ? recordTask.error.message
      : recordTask.error && 'That was not saved. Please try again.';

  return (
    <View className="gap-5">
      <View className="flex-row gap-2">
        <Chip
          role="radio"
          label="Today"
          isSelected={isToday}
          onPress={() => onSelectDate(undefined)}
        />
        <Chip
          role="radio"
          label="Yesterday"
          isSelected={!isToday}
          onPress={() => onSelectDate(yesterday)}
        />
      </View>

      {errorMessage && <FormMessage message={errorMessage} />}

      {items.length === 0 ? (
        <EmptyState
          title="Nothing planned for this day"
          message="Tasks appear here once the care plan has a routine for this day."
        />
      ) : (
        <View className="gap-3">
          <Text variant="caption" accessibilityLiveRegion="polite">
            {doneCount} of {items.length} done
          </Text>
          <View className="rounded-lg border border-border bg-surface px-4">
            {items.map((item, index) => (
              <ChecklistItemRow
                key={item.task.id}
                item={item}
                isFirst={index === 0}
                canRecord={canRecord}
                onRecord={(outcome) =>
                  recordTask.mutate({
                    taskId: item.task.id,
                    input: { date: date ?? today, outcome },
                  })
                }
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
