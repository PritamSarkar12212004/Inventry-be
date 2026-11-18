import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkeletonBox } from '../../../core/components/SkeletonBox';
import { colors, radius, spacing } from '../../../core/theme';

const HISTORY_PLACEHOLDERS = [0, 1, 2];

export function HistoryRowsSkeleton() {
  return (
    <View style={styles.historyList}>
      {HISTORY_PLACEHOLDERS.map((key) => (
        <View key={key} style={styles.historyCard}>
          <View style={styles.rowBetween}>
            <SkeletonBox width="45%" height={14} />
            <SkeletonBox width={68} height={20} borderRadius={radius.full} />
          </View>
          <View style={[styles.rowBetween, styles.mt8]}>
            <SkeletonBox width="35%" height={12} />
            <SkeletonBox width="24%" height={13} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function ProductDetailSkeleton() {
  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SkeletonBox width="100%" height={200} borderRadius={radius.lg} />

        <View style={styles.sectionCard}>
          <View style={styles.rowBetween}>
            <View style={styles.titleCol}>
              <SkeletonBox width="70%" height={18} />
              <SkeletonBox width="45%" height={13} style={styles.mt6} />
            </View>
            <SkeletonBox width={74} height={24} borderRadius={radius.full} />
          </View>

          <View style={styles.kpiRow}>
            {[0, 1, 2, 3].map((k) => (
              <View key={k} style={styles.kpiBox}>
                <SkeletonBox width="60%" height={11} />
                <SkeletonBox width="75%" height={16} style={styles.mt6} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <SkeletonBox width="40%" height={15} />
          <View style={styles.priceGrid}>
            {[0, 1, 2, 3].map((k) => (
              <View key={k} style={styles.priceCell}>
                <SkeletonBox width="50%" height={11} />
                <SkeletonBox width="65%" height={15} style={styles.mt6} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.tabsRow}>
            <SkeletonBox width="30%" height={32} borderRadius={radius.md} />
            <SkeletonBox width="30%" height={32} borderRadius={radius.md} />
            <SkeletonBox width="30%" height={32} borderRadius={radius.md} />
          </View>
          <HistoryRowsSkeleton />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleCol: {
    flex: 1,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  priceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  priceCell: {
    width: '48%',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  historyList: {
    gap: spacing.sm,
  },
  historyCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.sm,
    padding: spacing.sm + 2,
  },
  mt6: {
    marginTop: 6,
  },
  mt8: {
    marginTop: 8,
  },
});
