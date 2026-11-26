import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { useOfflineAttendanceSync } from '../hooks/use-offline-attendance-sync';

const BANNER_SPACING = 8;

export function OfflineSyncBanner() {
  const { pendingCount, rejections, dismissRejections } = useOfflineAttendanceSync();
  const insets = useSafeAreaInsets();

  if (pendingCount === 0 && rejections.length === 0) {
    return null;
  }

  return (
    <View className="gap-2 px-[5%]" style={{ paddingTop: insets.top + BANNER_SPACING }}>
      {pendingCount > 0 && (
        <FormMessage
          tone="info"
          message={`${pendingCount} visit ${pendingCount === 1 ? 'record is' : 'records are'} saved on this phone and will send when you are online.`}
        />
      )}
      {rejections.map((rejection) => (
        <FormMessage
          key={rejection}
          message={`A saved visit record was not accepted: ${rejection}`}
        />
      ))}
      {rejections.length > 0 && (
        <View className="self-start">
          <Button label="Dismiss" variant="ghost" onPress={dismissRejections} />
        </View>
      )}
    </View>
  );
}
