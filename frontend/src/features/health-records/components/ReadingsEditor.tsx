import { READING_TYPES, REPORT_RULES, type ReadingType } from '@welcheq/shared';
import { View } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { READING_DETAILS } from '@/config/health-records';
import { emptyDraft, type ReadingDraft } from '../lib/reading-draft';
import { ReadingFields } from './ReadingFields';

export interface ReadingsEditorProps {
  drafts: ReadingDraft[];
  errors: Partial<Record<ReadingType, string>>;
  onChange: (drafts: ReadingDraft[]) => void;
}

export function ReadingsEditor({ drafts, errors, onChange }: ReadingsEditorProps) {
  const chosen = new Set(drafts.map((draft) => draft.type));
  const isFull = drafts.length >= REPORT_RULES.MAX_READINGS_PER_REPORT;

  const toggle = (type: ReadingType) =>
    onChange(
      chosen.has(type)
        ? drafts.filter((draft) => draft.type !== type)
        : isFull
          ? drafts
          : [...drafts, emptyDraft(type)],
    );

  return (
    <View className="gap-4">
      <View className="gap-3">
        <Text variant="label">Readings taken (optional)</Text>
        <View className="flex-row flex-wrap gap-2">
          {READING_TYPES.map((type) => (
            <Chip
              key={type}
              label={READING_DETAILS[type].label}
              isSelected={chosen.has(type)}
              onPress={() => toggle(type)}
            />
          ))}
        </View>
      </View>
      {drafts.map((draft) => (
        <ReadingFields
          key={draft.type}
          draft={draft}
          errorMessage={errors[draft.type]}
          onChange={(next) =>
            onChange(drafts.map((current) => (current.type === next.type ? next : current)))
          }
          onRemove={() => toggle(draft.type)}
        />
      ))}
    </View>
  );
}
