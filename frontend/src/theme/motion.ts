import { Easing } from 'react-native-reanimated';

export const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

export const DURATION = {
  APPEAR: 700,
  STAGGER: 90,
  PRESS_IN: 200,
  PRESS_OUT: 440,
} as const;

export const APPEAR_OFFSET_Y = 12;
export const PRESSED_SCALE = 0.96;
export const MAX_STAGGER_STEPS = 8;
