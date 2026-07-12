export const fonts = {
  sans: 'Inter, system-ui, "Helvetica Neue", Helvetica, Arial, sans-serif',
  mono: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
};

export const colors = {
  primary: '#f54e00',
  primaryActive: '#d04200',
  onPrimary: '#ffffff',
  ink: '#26251e',
  body: '#5a5852',
  bodyStrong: '#26251e',
  muted: '#807d72',
  mutedSoft: '#a09c92',
  hairline: '#e6e5e0',
  hairlineSoft: '#efeee8',
  hairlineStrong: '#cfcdc4',
  canvas: '#f7f7f4',
  canvasSoft: '#fafaf7',
  surface: '#ffffff',
  surfaceStrong: '#e6e5e0',
  income: '#1f8a65',
  expense: '#cf2d56',
  danger: '#cf2d56',
  success: '#1f8a65',
  successBg: '#e8f5f0',
  overlay: 'rgba(38, 37, 30, 0.4)',
  tabInactive: '#a09c92',
  // aliases used across existing components
  text: '#26251e',
  textSecondary: '#5a5852',
  border: '#e6e5e0',
  borderStrong: '#cfcdc4',
  background: '#f7f7f4',
  surfaceMuted: '#fafaf7',
  primaryHover: '#d04200',
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  base: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 80,
};

export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 9999,
};

export const typography = {
  displayLg: { fontSize: 36, fontWeight: '400' as const, lineHeight: 43, letterSpacing: -0.72 },
  displayMd: { fontSize: 26, fontWeight: '400' as const, lineHeight: 32.5, letterSpacing: -0.325 },
  displaySm: { fontSize: 22, fontWeight: '400' as const, lineHeight: 28.6, letterSpacing: -0.11 },
  titleMd: { fontSize: 18, fontWeight: '600' as const, lineHeight: 25.2 },
  titleSm: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22.4 },
  bodyMd: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySm: { fontSize: 14, fontWeight: '400' as const, lineHeight: 21 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18.2 },
  captionUpper: { fontSize: 11, fontWeight: '600' as const, lineHeight: 15.4, letterSpacing: 0.88 },
  button: { fontSize: 14, fontWeight: '500' as const, lineHeight: 14 },
  code: { fontSize: 13, fontWeight: '400' as const, lineHeight: 19.5 },
};

/** @deprecated Prefer typography.* — kept for existing screens */
export const fontSize = {
  xs: 12,
  sm: 13,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 26,
  hero: 36,
};

export const layout = {
  maxWidth: 720,
  contentPadding: 16,
  contentPaddingWide: 24,
  compactBreakpoint: 640,
  touchTarget: 44,
};

export default {
  light: {
    text: colors.ink,
    background: colors.surface,
    tint: colors.primary,
    tabIconDefault: colors.tabInactive,
    tabIconSelected: colors.primary,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: '#fff',
    tabIconDefault: colors.tabInactive,
    tabIconSelected: '#fff',
  },
};
