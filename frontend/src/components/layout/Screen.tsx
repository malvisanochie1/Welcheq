import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';
import { layout } from '@/theme';

export interface ScreenProps {
  children: ReactNode;
  isScrollable?: boolean;
  isWide?: boolean;
  contentClassName?: string;
}

export function Screen({
  children,
  isScrollable = true,
  isWide = false,
  contentClassName,
}: ScreenProps) {
  const content = (
    <View
      className={cn('w-full flex-1 self-center px-[5%] py-6', contentClassName)}
      style={{ maxWidth: isWide ? layout.wideMaxWidth : layout.contentMaxWidth }}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isScrollable ? (
          <ScrollView
            contentContainerClassName="flex-grow"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
