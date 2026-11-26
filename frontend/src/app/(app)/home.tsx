import { PATIENT_MANAGER_ROLES, USER_ROLE } from '@welcheq/shared';
import { router } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { EmptyState } from '@/components/layout/EmptyState';
import { ErrorState } from '@/components/layout/ErrorState';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Skeleton } from '@/components/ui/Skeleton';
import { ShiftList } from '@/features/attendance/components/ShiftList';
import { useMyShifts } from '@/features/attendance/hooks/use-attendance';
import { useDateRange } from '@/features/attendance/hooks/use-local-dates';
import { useOwnProfile } from '@/features/auth/hooks/use-own-profile';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { PatientCard } from '@/features/patients/components/PatientCard';
import { usePatients } from '@/features/patients/hooks/use-patients';
import { useIsWideLayout } from '@/hooks/use-is-wide-layout';
import { cn } from '@/lib/cn';
import { usePalette } from '@/features/accessibility/hooks/use-palette';
import { touchTarget } from '@/theme';

const SKELETON_ROWS = 3;
const CARD_HEIGHT = 80;
const ICON_SIZE = 22;

const EMPTY_COPY = {
  manager: {
    title: 'Add the person you care for',
    message: 'Register them once. Then invite their caregiver and set up their daily routine.',
  },
  caregiver: {
    title: 'No patients yet',
    message: 'When a family or agency adds you as a caregiver, their patient will appear here.',
  },
} as const;

export default function HomeScreen() {
  const palette = usePalette();
  const { data: profile } = useOwnProfile();
  const patients = usePatients();
  const isWide = useIsWideLayout();
  const isCaregiver = profile?.role === USER_ROLE.CAREGIVER;
  const todaysVisits = useMyShifts(useDateRange(0, 0), isCaregiver);
  const canRegister = (PATIENT_MANAGER_ROLES as readonly string[]).includes(profile?.role ?? '');
  const emptyCopy = canRegister ? EMPTY_COPY.manager : EMPTY_COPY.caregiver;

  if (patients.isError) {
    return (
      <ErrorState
        title="We couldn't load your patients"
        message={patients.error.message}
        onRetry={() => patients.refetch()}
      />
    );
  }

  const addPatient = () => router.push('/patients/new');
  const joinWithCode = () => router.push('/join');

  return (
    <Screen isWide={isWide} contentClassName="gap-6">
      <ScreenHeader
        title={canRegister ? 'Your loved ones' : 'Your patients'}
        subtitle={profile ? `Hello, ${profile.fullName.split(' ')[0]}` : undefined}
        action={
          !isWide && (
            <View className="flex-row">
              <NotificationBell />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Settings"
                onPress={() => router.push('/settings')}
                className="items-center justify-center"
                style={{ minWidth: touchTarget.min, minHeight: touchTarget.min }}
              >
                <Settings size={ICON_SIZE} color={palette.ink} />
              </Pressable>
            </View>
          )
        }
      />

      {isCaregiver && todaysVisits.data && todaysVisits.data.length > 0 && (
        <View className="gap-3">
          <Text variant="heading">Today's visits</Text>
          <ShiftList shifts={todaysVisits.data} titleFor={(shift) => shift.patientName} />
        </View>
      )}

      {patients.isPending ? (
        <View className="gap-3">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <Skeleton key={index} height={CARD_HEIGHT} />
          ))}
        </View>
      ) : patients.data.length === 0 ? (
        <EmptyState
          title={emptyCopy.title}
          message={emptyCopy.message}
          action={
            <View className="gap-2">
              {canRegister && <Button label="Add a loved one" onPress={addPatient} />}
              <Button
                label="Join with a code"
                variant={canRegister ? 'ghost' : 'primary'}
                onPress={joinWithCode}
              />
            </View>
          }
        />
      ) : (
        <View className="gap-4">
          <View className={cn('gap-3', isWide && 'flex-row flex-wrap')}>
            {patients.data.map((patient) => (
              <View key={patient.id} className={cn(isWide && 'w-[49%]')}>
                <PatientCard
                  patient={patient}
                  onPress={() =>
                    router.push({
                      pathname: '/patients/[patientId]',
                      params: { patientId: patient.id },
                    })
                  }
                />
              </View>
            ))}
          </View>
          {canRegister && !isWide && patients.data.length > 1 && (
            <Button
              label="Overview of everyone"
              variant="secondary"
              onPress={() => router.push('/dashboard')}
            />
          )}
          <View className={cn('gap-2', isWide && 'flex-row self-start')}>
            {canRegister && <Button label="Add another" variant="secondary" onPress={addPatient} />}
            <Button label="Join with a code" variant="ghost" onPress={joinWithCode} />
          </View>
        </View>
      )}
    </Screen>
  );
}
