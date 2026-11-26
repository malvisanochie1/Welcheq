import { TASK_OUTCOME, type TaskOutcome } from '@welcheq/shared';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { CATEGORY_DETAILS, STATUS_DETAILS } from '@/config/care-plan';
import { cn } from '@/lib/cn';
import { palette } from '@/theme';
import type { ChecklistItem } from '../api/care-plan.api';
import { StatusChip } from './StatusChip';

const ICON_SIZE = 20;

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

export interface ChecklistItemRowProps {
  item: ChecklistItem;
  canRecord: boolean;
  isFirst: boolean;
  onRecord: (outcome: TaskOutcome) => void;
}

export function ChecklistItemRow({ item, canRecord, isFirst, onRecord }: ChecklistItemRowProps) {
  const { task, status, record } = item;
  const category = CATEGORY_DETAILS[task.category];
  const Icon = category.icon;

  return (
    <View
      accessible={!canRecord}
      accessibilityLabel={`${task.time}, ${task.title}, ${STATUS_DETAILS[status].label}`}
      className={cn('gap-3 py-4', !isFirst && 'border-t border-border')}
    >
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft">
          <Icon size={ICON_SIZE} color={palette.primary} />
        </View>
        <View className="flex-1 gap-1">
          <Text variant="caption">
            {task.time} · {category.label}
          </Text>
          <Text variant="label" className="text-base">
            {task.title}
          </Text>
          {task.instructions && <Text variant="caption">{task.instructions}</Text>}
          {record && (
            <Text variant="caption" className="text-ink-subtle">
              Recorded by {record.recordedBy} at {formatTime(record.recordedAt)}
              {record.note ? ` · "${record.note}"` : ''}
            </Text>
          )}
        </View>
        <StatusChip status={status} />
      </View>

      {canRecord && (
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button
              label="Done"
              variant={record?.outcome === TASK_OUTCOME.DONE ? 'primary' : 'secondary'}
              onPress={() => onRecord(TASK_OUTCOME.DONE)}
              accessibilityHint={`Marks ${task.title} as done`}
            />
          </View>
          <View className="flex-1">
            <Button
              label="Not done"
              variant={record?.outcome === TASK_OUTCOME.NOT_DONE ? 'primary' : 'secondary'}
              onPress={() => onRecord(TASK_OUTCOME.NOT_DONE)}
              accessibilityHint={`Marks ${task.title} as not done`}
            />
          </View>
        </View>
      )}
    </View>
  );
}
