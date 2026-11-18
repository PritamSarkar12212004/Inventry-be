import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SkeletonBox } from '../../../core/components/SkeletonBox';
import { colors, radius, spacing } from '../../../core/theme';

const CUSTOMER_PLACEHOLDERS = [0, 1, 2, 3];

export function PendingCustomersListSkeleton() {
  return (
    <View style={styles.listWrap}>
      {CUSTOMER_PLACEHOLDERS.map((key) => (
        <View key={key} style={styles.customerCard}>
          <View style={styles.topRow}>
            <SkeletonBox width={42} height={42} borderRadius={radius.full} />
            <View style={styles.metaCol}>
              <SkeletonBox width="60%" height={15} />
              <SkeletonBox width="38%" height={12} style={styles.mt6} />
            </View>
            <View style={styles.rightCol}>
              <SkeletonBox width={68} height={15} />
              <SkeletonBox width={74} height={12} style={styles.mt6} />
            </View>
          </View>

          <SkeletonBox
            width="100%"
            height={5}
            borderRadius={radius.full}
            style={styles.mt10}
          />

          <View style={styles.footerRow}>
            <View style={styles.pillRow}>
              <SkeletonBox width={90} height={20} borderRadius={radius.full} />
              <SkeletonBox width={54} height={20} borderRadius={radius.full} />
            </View>
            <SkeletonBox width={96} height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function FinancialOverviewSkeleton() {
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.kpiRow}>
        {[0, 1].map((k) => (
          <View key={k} style={styles.kpiCard}>
            <SkeletonBox width="50%" height={12} />
            <SkeletonBox width="70%" height={20} style={styles.mt8} />
            <SkeletonBox width="55%" height={12} style={styles.mt6} />
          </View>
        ))}
      </View>

      <View style={styles.fullCard}>
        <View>
          <SkeletonBox width={72} height={12} />
          <SkeletonBox width={58} height={12} style={styles.mt6} />
        </View>
        <SkeletonBox width={80} height={20} />
      </View>

      <View style={styles.fullCard}>
        <View style={styles.netLeft}>
          <SkeletonBox width={22} height={22} borderRadius={radius.full} />
          <View>
            <SkeletonBox width={96} height={14} />
            <SkeletonBox width={120} height={11} style={styles.mt4} />
          </View>
        </View>
        <SkeletonBox width={82} height={20} />
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <SkeletonBox width={165} height={16} />
          <SkeletonBox width={135} height={12} style={styles.mt4} />
        </View>
        <SkeletonBox width={92} height={24} borderRadius={radius.full} />
      </View>

      <View style={styles.searchRow}>
        <SkeletonBox width="84%" height={44} borderRadius={radius.md} />
        <SkeletonBox width={44} height={44} borderRadius={radius.md} />
      </View>

      <PendingCustomersListSkeleton />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
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
  fullCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  netLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  listWrap: {
    gap: spacing.sm,
  },
  customerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaCol: {
    flex: 1,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  mt4: {
    marginTop: 4,
  },
  mt6: {
    marginTop: 6,
  },
  mt8: {
    marginTop: 8,
  },
  mt10: {
    marginTop: 10,
  },
});
