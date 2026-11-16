import { Platform } from 'react-native';

export const colors = {
  // Primary Brand (Modern Indigo-Blue — crisp & readable)
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primarySoft: '#EFF6FF',
  secondary: '#0F172A',

  // Surfaces & Backgrounds (Layered depth)
  background: '#F4F6FA',
  surface: '#FFFFFF',
  surfaceSubtle: '#F8FAFC',
  surfacePressed: '#F1F5F9',

  // Typography
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Borders & Dividers
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  borderFocus: '#2563EB',

  // Warehouse Semantic Statuses (High-visibility badges)
  success: '#15803D',
  successBg: '#DCFCE7',
  successBorder: '#BBF7D0',

  warning: '#B45309',
  warningBg: '#FEF3C7',
  warningBorder: '#FDE68A',

  danger: '#B91C1C',
  dangerBg: '#FEE2E2',
  dangerBorder: '#FECACA',

  info: '#0369A1',
  infoBg: '#E0F2FE',
  infoBorder: '#BAE6FD',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  hero: 30,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

// Warehouse UX: Minimum 48px touch target for fast thumb tapping
export const touchTarget = {
  minHeight: 48,
  iconButton: 44,
} as const;

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
  }),
  floating: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: {
      elevation: 6,
    },
  }),
} as const;
