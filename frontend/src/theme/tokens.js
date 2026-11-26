/** Single source of truth for design tokens, read by both Tailwind and runtime code. */
const palette = {
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

module.exports = { palette, fontFamily, radius, touchTarget, layout };
