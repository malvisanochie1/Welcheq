import { Text as NativeText, type TextProps as NativeTextProps } from 'react-native';

import { cn } from '@/lib/cn';

const VARIANT_CLASSES = {
  display: 'font-body-bold text-3xl leading-tight text-ink',
  title: 'font-body-semibold text-2xl leading-snug text-ink',
  heading: 'font-body-semibold text-lg text-ink',
  body: 'font-body text-base leading-relaxed text-ink',
  label: 'font-body-medium text-sm text-ink',
  caption: 'font-body text-sm text-ink-muted',
} as const;

export type TextVariant = keyof typeof VARIANT_CLASSES;

export interface TextProps extends NativeTextProps {
  variant?: TextVariant;
  className?: string;
}

const ACCESSIBILITY_ROLE_BY_VARIANT: Partial<Record<TextVariant, 'header'>> = {
  display: 'header',
  title: 'header',
  heading: 'header',
};

export function Text({ variant = 'body', className, ...props }: TextProps) {
  return (
    <NativeText
      accessibilityRole={ACCESSIBILITY_ROLE_BY_VARIANT[variant]}
      className={cn(VARIANT_CLASSES[variant], className)}
      {...props}
    />
  );
}
