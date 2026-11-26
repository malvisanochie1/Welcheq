import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { BRAND } from '@/config/brand';
import { useIsWideLayout } from '@/hooks/use-is-wide-layout';
import { Screen } from './Screen';

export interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const isWide = useIsWideLayout();

  const form = (
    <Screen contentClassName="justify-center gap-8">
      <View className="gap-2">
        <Text variant="title">{title}</Text>
        {subtitle && <Text variant="caption">{subtitle}</Text>}
      </View>
      {children}
      {footer}
    </Screen>
  );

  if (!isWide) {
    return form;
  }

  return (
    <View className="flex-1 flex-row bg-canvas">
      <View className="w-[42%] justify-between bg-primary p-12">
        <Text variant="title" className="text-on-primary">
          {BRAND.NAME}
        </Text>
        <Text variant="display" className="max-w-md text-on-primary">
          {BRAND.TAGLINE}
        </Text>
      </View>
      <View className="flex-1">{form}</View>
    </View>
  );
}
