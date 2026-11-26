import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { usePalette } from '@/features/accessibility/hooks/use-palette';
import { touchTarget } from '@/theme';
import { useUnreadNotificationCount } from '../hooks/use-notifications';

const ICON_SIZE = 22;
const MAX_SHOWN = 9;

export function NotificationBell() {
  const palette = usePalette();
  const unread = useUnreadNotificationCount();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      onPress={() => router.push('/notifications')}
      className="items-center justify-center"
      style={{ minWidth: touchTarget.min, minHeight: touchTarget.min }}
    >
      <Bell size={ICON_SIZE} color={palette.ink} />
      {unread > 0 && (
        <View className="absolute right-1 top-1 min-w-5 items-center rounded-full bg-danger px-1">
          <Text variant="label" className="text-xs text-on-primary">
            {unread > MAX_SHOWN ? `${MAX_SHOWN}+` : unread}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
