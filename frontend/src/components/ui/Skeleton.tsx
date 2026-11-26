import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { palette, radius } from '@/theme';

const PULSE_MS = 900;
const DIM_OPACITY = 0.45;

export interface SkeletonProps {
  height: number;
}

export function Skeleton({ height }: SkeletonProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(DIM_OPACITY, { duration: PULSE_MS }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { height, borderRadius: radius.lg, backgroundColor: palette['surface-muted'] },
        animatedStyle,
      ]}
    />
  );
}
