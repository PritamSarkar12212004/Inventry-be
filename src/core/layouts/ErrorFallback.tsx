import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import React from 'react';
import { FallbackProps } from 'react-error-boundary';
import { colors, fontSize, radius, spacing } from '../theme';

const ErrorFallback = ({ resetErrorBoundary }: FallbackProps) => {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Kuch galat ho gaya</Text>
      <Text style={styles.errorSubtitle}>
        App mein unexpected error aaya hai. Kripya dobara try karein.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={resetErrorBoundary}>
        <Text style={styles.retryText}>Reload App</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ErrorFallback;
const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  errorSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  retryText: {
    color: colors.textInverse,
    fontWeight: '600',
    fontSize: fontSize.md,
  },
});
