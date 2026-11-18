import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SkeletonBox } from '../../../core/components/SkeletonBox';
import { radius, spacing } from '../../../core/theme';

export function ProfileFormSkeleton() {
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.logoWrap}>
        <SkeletonBox width={96} height={96} borderRadius={radius.lg} />
        <SkeletonBox width={150} height={12} style={styles.mt8} />
      </View>

      {[0, 1, 2].map((idx) => (
        <View key={idx} style={styles.fieldGroup}>
          <SkeletonBox width="35%" height={13} />
          <SkeletonBox
            width="100%"
            height={48}
            borderRadius={radius.md}
            style={styles.mt6}
          />
        </View>
      ))}

      <SkeletonBox
        width="100%"
        height={48}
        borderRadius={radius.md}
        style={styles.mt16}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  fieldGroup: {
    gap: 2,
  },
  mt6: {
    marginTop: 6,
  },
  mt8: {
    marginTop: 8,
  },
  mt16: {
    marginTop: 16,
  },
});
