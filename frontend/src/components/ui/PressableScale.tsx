import type { ReactNode } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { DURATION, EASE_OUT, PRESSED_SCALE } from '@/theme';

export interface PressableScaleProps extends Omit<PressableProps, 'children'> {
  children: ReactNode;
  className?: string;
}

/** Animated wrapper takes style only and the inner Pressable takes classes, which Android requires. */
export function PressableScale({
  children,
  className,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        className={className}
        disabled={disabled}
        onPressIn={(event) => {
          scale.value = withTiming(PRESSED_SCALE, {
            duration: DURATION.PRESS_IN,
            easing: EASE_OUT,
          });
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scale.value = withTiming(1, { duration: DURATION.PRESS_OUT, easing: EASE_OUT });
          onPressOut?.(event);
        }}
        {...props}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
