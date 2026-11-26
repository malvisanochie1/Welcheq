import { CARE_RELATIONSHIP } from '@welcheq/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { EmptyState } from '@/components/layout/EmptyState';
import { ErrorState } from '@/components/layout/ErrorState';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { VISIT_HISTORY_DAYS, VISIT_LOOKAHEAD_DAYS } from '@/config/attendance';
import { ShiftList } from '@/features/attendance/components/ShiftList';
import {
  useCancelShift,
  usePatientShifts,
  usePatientVisits,
} from '@/features/attendance/hooks/use-attendance';
import { useDateRange } from '@/features/attendance/hooks/use-local-dates';
import { usePatient } from '@/features/patients/hooks/use-patients';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { formatDay, formatTime } from '@/lib/format-date';

const SKELETON_HEIGHT = 240;

export default function VisitsScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const patient = usePatient(patientId);
  const range = useDateRange(VISIT_HISTORY_DAYS, VISIT_LOOKAHEAD_DAYS, patient.data?.timeZone);
  const shifts = usePatientShifts(patientId, range);
  const visits = usePatientVisits(patientId, range);
  const cancelShift = useCancelShift(patientId);
  const isOwner = patient.data?.relationship === CARE_RELATIONSHIP.OWNER;

  if (shifts.isError) {
    return (
      <ErrorState
        title="We couldn't load visits"
        message={shifts.error.message}
        onRetry={() => shifts.refetch()}
      />
    );
  }

  const now = Date.now();
  const upcoming = (shifts.data ?? []).filter((shift) => new Date(shift.endsAt).getTime() > now);
  const past = (shifts.data ?? [])
    .filter((shift) => new Date(shift.endsAt).getTime() <= now)
    .reverse();
  const unscheduled = (visits.data ?? []).filter((visit) => visit.shiftId === null);
  const cancelError = cancelShift.error instanceof ApiError ? cancelShift.error.message : null;

  return (
    <Screen contentClassName="gap-6">
      <ScreenHeader canGoBack title="Visits" subtitle={patient.data?.fullName} />

      {isOwner && (
        <Button
          label="Schedule a visit"
          onPress={() =>
            router.push({ pathname: '/patients/[patientId]/schedule-visit', params: { patientId } })
          }
        />
      )}
      {cancelError && <FormMessage message={cancelError} />}

      {!shifts.data ? (
        <Skeleton height={SKELETON_HEIGHT} />
      ) : shifts.data.length === 0 && unscheduled.length === 0 ? (
        <EmptyState
          title="No visits yet"
          message="Scheduled visits and check-ins from the last week and the next two weeks appear here."
        />
      ) : (
        <View className="gap-6">
          {upcoming.length > 0 && (
            <View className="gap-3">
              <Text variant="heading">Today and upcoming</Text>
              <ShiftList
                shifts={upcoming}
                titleFor={(shift) => shift.caregiver.fullName}
                onCancel={isOwner ? (shift) => cancelShift.mutate(shift.id) : undefined}
              />
            </View>
          )}
          {past.length > 0 && (
            <View className="gap-3">
              <Text variant="heading">Last 7 days</Text>
              <ShiftList shifts={past} titleFor={(shift) => shift.caregiver.fullName} />
            </View>
          )}
          {unscheduled.length > 0 && (
            <View className="gap-3">
              <Text variant="heading">Unscheduled check-ins</Text>
              <View className="rounded-lg border border-border bg-surface px-4">
                {unscheduled.map((visit, index) => (
                  <View
                    key={visit.id}
                    className={cn('gap-1 py-4', index > 0 && 'border-t border-border')}
                  >
                    <Text variant="label" className="text-base">
                      {visit.caregiver.fullName}
                    </Text>
                    <Text variant="caption">
                      {formatDay(visit.checkInAt)} · arrived {formatTime(visit.checkInAt)}
                      {visit.checkOutAt
                        ? ` · left ${formatTime(visit.checkOutAt)}`
                        : ' · still there'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}
