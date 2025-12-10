import { ColorSchemeName } from 'react-native';

export const palette = {
  light: {
    background: '#f4f6fb',
    surface: '#ffffff',
    surfaceAlt: '#f8fafc',
    border: '#e2e8f0',
    muted: '#475569',
    text: '#0f172a',
    primary: '#0f766e',
    primarySoft: '#34d399',
    success: '#16a34a',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#0284c7',
    shadow: '#0f172a',
  },
  dark: {
    background: '#0b1220',
    surface: '#0f172a',
    surfaceAlt: '#111827',
    border: '#1f2937',
    muted: '#cbd5e1',
    text: '#e5e7eb',
    primary: '#22d3ee',
    primarySoft: '#34d399',
    success: '#4ade80',
    warning: '#fbbf24',
    danger: '#f87171',
    info: '#38bdf8',
    shadow: '#0f172a',
  },
};

export const typography = {
  family: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  xxl: 28,
};

export const shadows = {
  card: {
    shadowColor: palette.light.shadow,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 4,
  },
};

export const themeFor = (scheme: ColorSchemeName) => palette[scheme ?? 'light'];
