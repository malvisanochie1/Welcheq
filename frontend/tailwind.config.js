const { themedColors, fontFamily, radius } = require('./src/theme/tokens');

const toPixels = (scale) =>
  Object.fromEntries(Object.entries(scale).map(([name, value]) => [name, `${value}px`]));

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  /** Built at runtime by the larger-text and easier-reading settings, so never found in source. */
  safelist: [
    ...['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'].map((size) => `text-${size}`),
    'tracking-wide',
    'leading-loose',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: themedColors,
      fontFamily: Object.fromEntries(
        Object.entries(fontFamily).map(([name, family]) => [name, [family]]),
      ),
      borderRadius: toPixels(radius),
    },
  },
  plugins: [],
};
