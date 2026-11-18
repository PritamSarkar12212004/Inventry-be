import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SkeletonBox } from '../../../core/components/SkeletonBox';
import { colors, radius, spacing } from '../../../core/theme';

export function SuppliersPurchasesSkeleton() {
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.kpiRow}>
        {[0, 1].map((k) => (
          <View key={k} style={styles.kpiCard}>
            <SkeletonBox width="55%" height={12} />
            <SkeletonBox width="70%" height={20} style={styles.mt8} />
            <SkeletonBox width="65%" height={12} style={styles.mt6} />
          </View>
        ))}
      </View>

      <View style={styles.outflowCard}>
        <SkeletonBox width="65%" height={14} />
        <SkeletonBox width="50%" height={12} style={styles.mt6} />
      </View>

      <SkeletonBox width="45%" height={16} style={styles.sectionTitle} />

      {[0, 1, 2].map((k) => (
        <View key={k} style={styles.listCard}>
          <SkeletonBox width={38} height={38} borderRadius={radius.full} />
          <View style={styles.listMeta}>
            <SkeletonBox width="55%" height={14} />
            <SkeletonBox width="35%" height={12} style={styles.mt6} />
          </View>
          <SkeletonBox width={70} height={15} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  outflowCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  sectionTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  listMeta: {
    flex: 1,
  },
  mt6: {
    marginTop: 6,
  },
  mt8: {
    marginTop: 8,
  },
});
