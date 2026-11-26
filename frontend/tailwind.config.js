const { palette, fontFamily, radius } = require('./src/theme/tokens');

const toPixels = (scale) =>
  Object.fromEntries(Object.entries(scale).map(([name, value]) => [name, `${value}px`]));

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: palette,
      fontFamily: Object.fromEntries(
        Object.entries(fontFamily).map(([name, family]) => [name, [family]]),
      ),
      borderRadius: toPixels(radius),
    },
  },
  plugins: [],
};
