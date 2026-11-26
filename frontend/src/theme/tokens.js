/** Single source of truth for design tokens, read by both Tailwind and runtime code. */
const standardPalette = {
  canvas: '#F6F8F7',
  surface: '#FFFFFF',
  'surface-muted': '#EEF2F1',
  border: '#DDE4E2',
  ink: '#12201F',
  'ink-muted': '#51625F',
  'ink-subtle': '#7A8A87',
  primary: '#0F5C5A',
  'primary-pressed': '#0B4846',
  'primary-soft': '#E2EFEE',
  'on-primary': '#FFFFFF',
  accent: '#B8692A',
  'accent-soft': '#F8EDE3',
  success: '#1E7A4C',
  'success-soft': '#E4F3EB',
  warning: '#A86A00',
  'warning-soft': '#FBF1DC',
  danger: '#B42318',
  'danger-soft': '#FCE9E7',
};

/** Stronger edges and darker text for people with low vision. */
const highContrastPalette = {
  ...standardPalette,
  canvas: '#FFFFFF',
  'surface-muted': '#E3E8E7',
  border: '#4A5856',
  ink: '#000000',
  'ink-muted': '#1F2A29',
  'ink-subtle': '#3A4746',
  primary: '#063F3D',
  'primary-pressed': '#042C2B',
  'primary-soft': '#D3E6E4',
  accent: '#8A4A12',
  success: '#0F5A35',
  warning: '#6E4500',
  danger: '#8A1A12',
};

/** Dark and dim for checking on someone at night without waking them. */
const nightPalette = {
  canvas: '#0E1514',
  surface: '#17201F',
  'surface-muted': '#202B2A',
  border: '#2E3B3A',
  ink: '#E6EDEC',
  'ink-muted': '#A9B8B5',
  'ink-subtle': '#7F8F8C',
  primary: '#5FB3AE',
  'primary-pressed': '#4A9893',
  'primary-soft': '#1C3634',
  'on-primary': '#0B1413',
  accent: '#E0A36E',
  'accent-soft': '#3A2A1C',
  success: '#6CCB97',
  'success-soft': '#173326',
  warning: '#E6B85C',
  'warning-soft': '#382C12',
  danger: '#F08A80',
  'danger-soft': '#3D1C19',
};

const palettes = {
  standard: standardPalette,
  'high-contrast': highContrastPalette,
  night: nightPalette,
};

/** Tailwind colours point at CSS variables so the whole app can switch palette at runtime. */
const colorVariable = (name) => `var(--color-${name})`;
const themedColors = Object.fromEntries(
  Object.keys(standardPalette).map((name) => [name, colorVariable(name)]),
);

const fontFamily = {
  body: 'Inter_400Regular',
  'body-medium': 'Inter_500Medium',
  'body-semibold': 'Inter_600SemiBold',
  'body-bold': 'Inter_700Bold',
};

const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

const touchTarget = {
  min: 48,
};

const layout = {
  contentMaxWidth: 560,
  wideMaxWidth: 1180,
  desktopBreakpoint: 1024,
  sidebarWidth: 264,
};

module.exports = {
  palette: standardPalette,
  palettes,
  themedColors,
  fontFamily,
  radius,
  touchTarget,
  layout,
};
