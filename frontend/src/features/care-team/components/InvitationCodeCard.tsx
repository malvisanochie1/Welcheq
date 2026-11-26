import { INVITATION_EXPIRY_DAYS } from '@welcheq/shared';
import { Share, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { invitationShareMessage } from '@/config/care-team';

export interface InvitationCodeCardProps {
  code: string;
  patientName: string;
}

export function InvitationCodeCard({ code, patientName }: InvitationCodeCardProps) {
  const share = () =>
    Share.share({ message: invitationShareMessage(patientName, code) }).catch(() => undefined);

  return (
    <View className="gap-6">
      <View className="items-center gap-3 rounded-lg border-2 border-primary bg-primary-soft px-6 py-8">
        <Text variant="caption">Invite code</Text>
        <Text
          variant="display"
          selectable
          accessibilityLabel={`Invite code ${code.split('').join(' ')}`}
          className="tracking-widest text-primary"
        >
          {code}
        </Text>
        <Text variant="caption" className="text-center">
          Works once. Expires in {INVITATION_EXPIRY_DAYS} days.
        </Text>
      </View>
      <Button label="Share code" onPress={share} />
    </View>
  );
}
