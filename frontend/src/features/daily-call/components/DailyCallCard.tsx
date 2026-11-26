import { CALL_OUTCOME, CARE_RELATIONSHIP, type CareRelationship } from '@welcheq/shared';
import { router } from 'expo-router';
import { PhoneCall } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { AppState, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { formatTime } from '@/lib/format-date';
import { usePalette } from '@/features/accessibility/hooks/use-palette';
import type { RecordedCall } from '../api/daily-call.api';
import { useDailyCallPlan } from '../hooks/use-daily-call';
import { openPhoneCall, openWhatsAppCall } from '../lib/call-links';
import { PatientPhoneForm } from './PatientPhoneForm';

const ICON_SIZE = 20;

function describeToday(calls: RecordedCall[], firstName: string): string {
  const reached = calls.find((call) => call.outcome === CALL_OUTCOME.REACHED);
  if (reached) {
    const result =
      reached.mismatchCount === 0
        ? 'everything matched the caregiver’s records'
        : `${reached.mismatchCount} answer${reached.mismatchCount === 1 ? '' : 's'} did not match`;
    return `Spoke at ${formatTime(reached.calledAt)} · ${result}.`;
  }
  const latest = calls[0];
  if (latest) return `Could not reach ${firstName} at ${formatTime(latest.calledAt)}.`;
  return `A quick daily call helps you hear from ${firstName} directly.`;
}

export interface DailyCallCardProps {
  patientId: string;
  relationship: CareRelationship;
}

export function DailyCallCard({ patientId, relationship }: DailyCallCardProps) {
  const palette = usePalette();
  const plan = useDailyCallPlan(patientId);
  const isAwaitingReturn = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isAwaitingReturn.current) {
        isAwaitingReturn.current = false;
        router.push({ pathname: '/patients/[patientId]/daily-call', params: { patientId } });
      }
    });
    return () => subscription.remove();
  }, [patientId]);

  if (!plan.data) {
    return null;
  }

  const { patientFirstName, phone, todaysCalls } = plan.data;
  const hasSpoken = todaysCalls.some((call) => call.outcome === CALL_OUTCOME.REACHED);
  const startCall = (open: (phone: string) => Promise<unknown>) => () => {
    if (!phone) return;
    isAwaitingReturn.current = true;
    open(phone).catch(() => {
      isAwaitingReturn.current = false;
    });
  };

  return (
    <View className="gap-4 rounded-lg border border-border bg-surface p-4">
      <View className="flex-row items-center gap-2">
        <PhoneCall size={ICON_SIZE} color={palette.primary} />
        <Text variant="heading" className="flex-1">
          {hasSpoken
            ? `You spoke with ${patientFirstName} today`
            : `Call ${patientFirstName} today`}
        </Text>
      </View>
      <Text variant="body" className="text-ink-muted">
        {describeToday(todaysCalls, patientFirstName)}
      </Text>

      {phone ? (
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button label="Call" onPress={startCall(openPhoneCall)} />
          </View>
          <View className="flex-1">
            <Button label="WhatsApp" variant="secondary" onPress={startCall(openWhatsAppCall)} />
          </View>
        </View>
      ) : relationship === CARE_RELATIONSHIP.OWNER ? (
        <PatientPhoneForm patientId={patientId} patientFirstName={patientFirstName} />
      ) : null}

      <Button
        label="Record what they told me"
        variant="ghost"
        onPress={() =>
          router.push({ pathname: '/patients/[patientId]/daily-call', params: { patientId } })
        }
      />
    </View>
  );
}
