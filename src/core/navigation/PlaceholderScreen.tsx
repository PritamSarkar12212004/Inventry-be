import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles, fontSize, fontWeight, spacing } from '../theme';

type PlaceholderScreenProps = {
  title: string;
  subtitle?: string;
  useSafeArea?: boolean;
};

export function PlaceholderScreen({
  title,
  subtitle = 'Ready for module implementation',
  useSafeArea = false,
}: PlaceholderScreenProps) {
  const Container = useSafeArea ? SafeAreaView : View;

  return (
    <Container style={[commonStyles.screen, commonStyles.center, styles.pad]}>
      <View style={[commonStyles.card, styles.box]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  pad: {
    padding: spacing.lg,
  },
  box: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
