import { ROTATING_CODE, SURPRISE_CHECK_STATUS, type AttendanceEventInput } from '@welcheq/shared';
import { MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { ApiError } from '@/lib/api-client';
import { formatTime } from '@/lib/format-date';
import { palette } from '@/theme';
import { useCheckIn, useCheckOut, useMyOpenVisit } from '../hooks/use-attendance';
import { createLocalId } from '../lib/sync-offline-attendance';
import { LocationUnavailableError, readCurrentLocation } from '../lib/read-location';
import { SelfieError, takeSelfie, uploadSelfie } from '../lib/selfie';
import { useOfflineAttendanceStore } from '../stores/offline-attendance.store';
import { SurpriseCheckPrompt } from './SurpriseCheckPrompt';

const ICON_SIZE = 20;
const OFFLINE_NOTICE =
  "No connection, so this was saved on your phone. It will be sent as soon as you're back online.";

export interface CheckInPanelProps {
  patientId: string;
  patientName: string;
  requiresHomeCode: boolean;
  requiresSelfie: boolean;
}

const HOME_CODE_PATTERN = new RegExp(`^\\d{${ROTATING_CODE.DIGITS}}$`);

export function CheckInPanel({
  patientId,
  patientName,
  requiresHomeCode,
  requiresSelfie,
}: CheckInPanelProps) {
  const openVisit = useMyOpenVisit();
  const checkIn = useCheckIn(patientId);
  const checkOut = useCheckOut(patientId);
  const queued = useOfflineAttendanceStore((state) => state.pending);
  const pending = queued.filter((entry) => entry.patientId === patientId);
  const enqueue = useOfflineAttendanceStore((state) => state.enqueue);
  const [isLocating, setIsLocating] = useState(false);
  const [homeCode, setHomeCode] = useState('');
  const [message, setMessage] = useState<{ text: string; tone: 'error' | 'info' } | null>(null);

  const pendingCheckIn = pending.find((entry) => entry.kind === 'check-in');
  const hasPendingCheckOut = pending.some((entry) => entry.kind === 'check-out');
  const visitHere = openVisit.data?.patientId === patientId ? openVisit.data : null;
  const isOnVisitElsewhere = Boolean(openVisit.data) && !visitHere;
  const isCheckedIn = Boolean(visitHere || pendingCheckIn) && !hasPendingCheckOut;

  const record = async (kind: 'check-in' | 'check-out') => {
    const needsCode = kind === 'check-in' && requiresHomeCode;
    if (needsCode && !HOME_CODE_PATTERN.test(homeCode)) {
      setMessage({ text: 'Enter the 6-digit code shown on the home display.', tone: 'error' });
      return;
    }

    setMessage(null);
    const needsSelfie = kind === 'check-in' && requiresSelfie;
    let selfieUri: string | null = null;
    if (needsSelfie) {
      try {
        selfieUri = await takeSelfie();
      } catch (error) {
        setMessage({
          text: error instanceof SelfieError ? error.message : 'Please try again.',
          tone: 'error',
        });
        return;
      }
      if (!selfieUri) return;
    }

    setIsLocating(true);
    let event: AttendanceEventInput;
    try {
      event = {
        location: await readCurrentLocation(),
        capturedAt: new Date().toISOString(),
        ...(needsCode ? { homeCode } : {}),
      };
    } catch (error) {
      setMessage({
        text: error instanceof LocationUnavailableError ? error.message : 'Please try again.',
        tone: 'error',
      });
      return;
    } finally {
      setIsLocating(false);
    }

    const visitRef = visitHere?.id ?? pendingCheckIn?.localId;

    try {
      if (kind === 'check-in') {
        const selfiePath = selfieUri ? await uploadSelfie(patientId, selfieUri) : undefined;
        await checkIn.mutateAsync({ ...event, ...(selfiePath ? { selfiePath } : {}) });
      } else {
        await checkOut.mutateAsync({ visitId: visitRef ?? '', event });
      }
      setHomeCode('');
    } catch (error) {
      if (error instanceof ApiError && error.status === 0) {
        const offlineEvent = { ...event, isOffline: true };
        enqueue(
          kind === 'check-in'
            ? {
                kind,
                localId: createLocalId(),
                patientId,
                event: offlineEvent,
                ...(selfieUri ? { selfieUri } : {}),
              }
            : {
                kind,
                localId: createLocalId(),
                patientId,
                visitRef: visitRef ?? '',
                event: offlineEvent,
              },
        );
        setMessage({ text: OFFLINE_NOTICE, tone: 'info' });
        return;
      }
      const isKnown = error instanceof ApiError || error instanceof SelfieError;
      setMessage({ text: isKnown ? error.message : 'Please try again.', tone: 'error' });
    }
  };

  const isBusy = isLocating || checkIn.isPending || checkOut.isPending;
  const since = visitHere?.checkInAt ?? pendingCheckIn?.event.capturedAt;

  return (
    <View className="gap-4 rounded-lg border-2 border-primary bg-surface p-4">
      <View className="flex-row items-center gap-2">
        <MapPin size={ICON_SIZE} color={palette.primary} />
        <Text variant="heading" className="flex-1">
          {isCheckedIn ? `On visit with ${patientName.split(' ')[0]}` : 'Your visit'}
        </Text>
      </View>

      {isCheckedIn && since && (
        <Text variant="body" className="text-ink-muted">
          Checked in at {formatTime(since)}
          {pendingCheckIn ? ' (waiting to send)' : ''}.
        </Text>
      )}
      {!isCheckedIn && !isOnVisitElsewhere && (
        <Text variant="body" className="text-ink-muted">
          Check in when you arrive. It only works at the home
          {requiresSelfie ? ', and starts with a quick selfie' : ''}.
        </Text>
      )}
      {isOnVisitElsewhere && (
        <FormMessage
          tone="info"
          message="You are checked in at another patient's home. Check out there first."
        />
      )}
      {visitHere?.surpriseCheck?.status === SURPRISE_CHECK_STATUS.DUE && (
        <SurpriseCheckPrompt
          patientId={patientId}
          visitId={visitHere.id}
          patientFirstName={patientName.split(' ')[0] ?? patientName}
        />
      )}
      {message && <FormMessage tone={message.tone} message={message.text} />}
      {!isCheckedIn && !isOnVisitElsewhere && requiresHomeCode && (
        <TextField
          label="Code on the home display"
          value={homeCode}
          onChangeText={(text) =>
            setHomeCode(text.replace(/\D/g, '').slice(0, ROTATING_CODE.DIGITS))
          }
          placeholder="123456"
          keyboardType="number-pad"
          maxLength={ROTATING_CODE.DIGITS}
        />
      )}

      {!isOnVisitElsewhere && (
        <Button
          label={isLocating ? 'Finding your location…' : isCheckedIn ? 'Check out' : 'Check in'}
          variant={isCheckedIn ? 'secondary' : 'primary'}
          onPress={() => record(isCheckedIn ? 'check-out' : 'check-in')}
          isLoading={isBusy}
        />
      )}
    </View>
  );
}
