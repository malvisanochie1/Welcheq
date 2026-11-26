import type { TextSize } from '../stores/display-preferences.store';

const SIZE_LADDER = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'] as const;
const STEPS: Readonly<Record<TextSize, number>> = { standard: 0, large: 1, 'extra-large': 2 };
const SIZE_CLASS = new RegExp(`^text-(${SIZE_LADDER.join('|')})$`);

/** Moves every text size class up the ladder, so larger text works however a size was set. */
export function scaleTextClasses(classes: string, textSize: TextSize): string {
  const steps = STEPS[textSize];
  if (steps === 0) return classes;
  return classes
    .split(' ')
    .map((token) => {
      const match = SIZE_CLASS.exec(token);
      if (!match) return token;
      const index = SIZE_LADDER.indexOf(match[1] as (typeof SIZE_LADDER)[number]);
      return `text-${SIZE_LADDER[Math.min(index + steps, SIZE_LADDER.length - 1)]}`;
    })
    .join(' ');
}
