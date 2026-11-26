import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { EmptyState } from '@/components/layout/EmptyState';
import { ErrorState } from '@/components/layout/ErrorState';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useOwnProfile } from '@/features/auth/hooks/use-own-profile';
import { MessageBubble } from '@/features/messages/components/MessageBubble';
import { MessageComposer } from '@/features/messages/components/MessageComposer';
import { useMessages } from '@/features/messages/hooks/use-messages';
import { usePatient } from '@/features/patients/hooks/use-patients';

const SKELETON_HEIGHT = 240;

export default function MessagesScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const patient = usePatient(patientId);
  const messages = useMessages(patientId);
  const { data: profile } = useOwnProfile();

  if (messages.isError) {
    return (
      <ErrorState
        title="We couldn't load messages"
        message={messages.error.message}
        onRetry={() => messages.refetch()}
      />
    );
  }

  const firstName = patient.data?.fullName.split(' ')[0];

  return (
    <Screen contentClassName="gap-6">
      <ScreenHeader
        canGoBack
        title="Messages"
        subtitle={
          firstName
            ? `Everyone caring for ${firstName} sees these messages`
            : 'Shared with the care team'
        }
      />
      {!messages.data ? (
        <Skeleton height={SKELETON_HEIGHT} />
      ) : messages.data.length === 0 ? (
        <EmptyState
          title="No messages yet"
          message="Share quick updates, questions and reminders with the family and caregivers."
        />
      ) : (
        <View className="gap-4">
          {messages.data.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.author.id === profile?.id}
              showAuthor={messages.data[index - 1]?.author.id !== message.author.id}
            />
          ))}
        </View>
      )}
      <MessageComposer patientId={patientId} />
    </Screen>
  );
}
