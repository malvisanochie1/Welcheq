import { DASHBOARD_PERIODS, DEFAULT_DASHBOARD_PERIOD, type DashboardPeriod } from '@welcheq/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { EmptyState } from '@/components/layout/EmptyState';
import { ErrorState } from '@/components/layout/ErrorState';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Chip } from '@/components/ui/Chip';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { CaregiverOverviewRow } from '@/features/dashboard/components/CaregiverOverviewRow';
import { PatientOverviewRow } from '@/features/dashboard/components/PatientOverviewRow';
import { StatTile } from '@/features/dashboard/components/StatTile';
import { useDashboard } from '@/features/dashboard/hooks/use-dashboard';
import { formatRate } from '@/features/dashboard/lib/format-rate';
import { useIsWideLayout } from '@/hooks/use-is-wide-layout';
import { cn } from '@/lib/cn';

const SKELETON_HEIGHT = 320;

export default function DashboardScreen() {
  const [days, setDays] = useState<DashboardPeriod>(DEFAULT_DASHBOARD_PERIOD);
  const overview = useDashboard(days);
  const isWide = useIsWideLayout();

  if (overview.isError) {
    return (
      <ErrorState
        title="We couldn't load the overview"
        message={overview.error.message}
        onRetry={() => overview.refetch()}
      />
    );
  }

  const data = overview.data;

  return (
    <Screen isWide={isWide} contentClassName="gap-8">
      <ScreenHeader
        canGoBack={!isWide}
        title="Overview"
        subtitle="Attendance, incidents and caregivers across everyone you look after"
      />
      <View accessibilityRole="radiogroup" className="flex-row gap-2">
        {DASHBOARD_PERIODS.map((period) => (
          <Chip
            key={period}
            role="radio"
            label={`Last ${period} days`}
            isSelected={days === period}
            onPress={() => setDays(period)}
          />
        ))}
      </View>

      {!data ? (
        <Skeleton height={SKELETON_HEIGHT} />
      ) : data.patients.length === 0 ? (
        <EmptyState
          title="Nothing to show yet"
          message="Patients you add appear here with their visits, incidents and caregivers."
        />
      ) : (
        <>
          <View className="flex-row flex-wrap gap-3">
            <StatTile
              value={`${data.totals.completed}/${data.totals.scheduled}`}
              label="Visits completed"
            />
            <StatTile value={formatRate(data.totals.onTimeRate)} label="Arrived on time" />
            <StatTile
              value={String(data.totals.missed)}
              label="Missed visits"
              isWarning={data.totals.missed > 0}
            />
            <StatTile
              value={String(data.totals.openIncidents)}
              label="Open incidents"
              isWarning={data.totals.openIncidents > 0}
            />
          </View>

          <View className={cn('gap-8', isWide && 'flex-row items-start')}>
            <View className="flex-1 gap-3">
              <Text variant="heading">Patients</Text>
              <View className="rounded-lg border border-border bg-surface px-4">
                {data.patients.map((patient, index) => (
                  <PatientOverviewRow key={patient.id} patient={patient} isFirst={index === 0} />
                ))}
              </View>
            </View>
            <View className="flex-1 gap-3">
              <Text variant="heading">Caregivers</Text>
              {data.caregivers.length === 0 ? (
                <Text variant="body" className="text-ink-muted">
                  No visits in this period.
                </Text>
              ) : (
                <View className="rounded-lg border border-border bg-surface px-4">
                  {data.caregivers.map((caregiver, index) => (
                    <CaregiverOverviewRow
                      key={caregiver.id}
                      caregiver={caregiver}
                      isFirst={index === 0}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}
