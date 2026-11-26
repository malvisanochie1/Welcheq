export declare const palette: Record<
  | 'canvas'
  | 'surface'
  | 'surface-muted'
  | 'border'
  | 'ink'
  | 'ink-muted'
  | 'ink-subtle'
  | 'primary'
  | 'primary-pressed'
  | 'primary-soft'
  | 'on-primary'
  | 'accent'
  | 'accent-soft'
  | 'success'
  | 'success-soft'
  | 'warning'
  | 'warning-soft'
  | 'danger'
  | 'danger-soft',
  string
>;

export declare const fontFamily: Record<
  'body' | 'body-medium' | 'body-semibold' | 'body-bold',
  string
>;

export declare const radius: Record<'sm' | 'md' | 'lg' | 'xl', number>;

export declare const touchTarget: { min: number };

export declare const layout: {
  contentMaxWidth: number;
  wideMaxWidth: number;
  desktopBreakpoint: number;
  sidebarWidth: number;
};
