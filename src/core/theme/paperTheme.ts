import { MD3LightTheme } from 'react-native-paper';
import { colors, radius } from './tokens';

export const paperTheme = {
  ...MD3LightTheme,
  roundness: radius.md,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: colors.textInverse,
    primaryContainer: colors.primarySoft,
    secondary: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceSubtle,
    error: colors.danger,
    outline: colors.border,
    onSurface: colors.textPrimary,
    onSurfaceVariant: colors.textSecondary,
  },
};
