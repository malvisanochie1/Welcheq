import { CHECKLIST_STATUS } from '@welcheq/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { ClipboardList, ListChecks, ShieldCheck } from 'lucide-react-native';
import { View } from 'react-native';

import { ErrorState } from '@/components/layout/ErrorState';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { LinkCard } from '@/components/ui/LinkCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { PROOF_METHOD_OPTIONS } from '@/config/proof-methods';
import { StatusChip } from '@/features/care-plan/components/StatusChip';
import { useChecklistSummary } from '@/features/care-plan/hooks/use-checklist-summary';
import { CareTeamSection } from '@/features/care-team/components/CareTeamSection';
import { usePatient } from '@/features/patients/hooks/use-patients';
import { ageFromDateOfBirth } from '@/features/patients/lib/age';

const SKELETON_HEIGHT = 120;

type ChecklistSummary = ReturnType<typeof useChecklistSummary>;

function describeToday(summary: ChecklistSummary): string {
  if (summary.isLoading) return 'Loading…';
  if (summary.total === 0) return 'No routine set up yet';
  return `${summary.done} of ${summary.total} done`;
}

function todayAccessory(summary: ChecklistSummary) {
  if (summary.missed > 0) return <StatusChip status={CHECKLIST_STATUS.MISSED} />;
  if (summary.due > 0) return <StatusChip status={CHECKLIST_STATUS.DUE} />;
  return undefined;
}

export default function PatientScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const patient = usePatient(patientId);
  const today = useChecklistSummary(patientId);

  if (patient.isError) {
    return (
      <ErrorState
        title="We couldn't open this patient"
        message={patient.error.message}
        onRetry={() => patient.refetch()}
      />
    );
  }

  if (!patient.data) {
    return (
      <Screen contentClassName="gap-4">
        <Skeleton height={SKELETON_HEIGHT} />
      </Screen>
    );
  }

  const { fullName, dateOfBirth, homeAddress, proofSettings } = patient.data;
  const age = ageFromDateOfBirth(dateOfBirth);
  const activeChecks = PROOF_METHOD_OPTIONS.filter((option) =>
    proofSettings.methods.includes(option.method),
  ).map((option) => option.title);
  const params = { patientId };

  return (
    <Screen contentClassName="gap-6">
      <ScreenHeader
        canGoBack
        title={fullName}
        subtitle={[age !== null ? `${age} years old` : null, homeAddress]
          .filter(Boolean)
          .join(' · ')}
      />

      <View className="gap-3">
        <LinkCard
          icon={ListChecks}
          title="Today's checklist"
          subtitle={describeToday(today)}
          accessory={todayAccessory(today)}
          onPress={() => router.push({ pathname: '/patients/[patientId]/checklist', params })}
        />
        <LinkCard
          icon={ClipboardList}
          title="Care plan"
          subtitle="The daily routine caregivers follow"
          onPress={() => router.push({ pathname: '/patients/[patientId]/care-plan', params })}
        />
        <LinkCard
          icon={ShieldCheck}
          title="Proof of visit"
          subtitle={activeChecks.join(' · ')}
          onPress={() => router.push({ pathname: '/patients/[patientId]/proof-settings', params })}
        />
      </View>

      <CareTeamSection patient={patient.data} />
    </Screen>
  );
}
