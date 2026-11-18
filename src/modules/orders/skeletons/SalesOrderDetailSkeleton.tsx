import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkeletonBox } from '../../../core/components/SkeletonBox';
import { colors, radius, spacing } from '../../../core/theme';

export function SalesOrderDetailSkeleton() {
  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <SkeletonBox width={130} height={18} />
            <SkeletonBox width={78} height={22} borderRadius={radius.full} />
          </View>
          <SkeletonBox width="45%" height={13} style={styles.mt8} />
          <SkeletonBox width="65%" height={13} style={styles.mt6} />
        </View>

        <View style={styles.card}>
          <SkeletonBox width="38%" height={15} />
          <View style={styles.kpiRow}>
            {[0, 1, 2].map((k) => (
              <View key={k} style={styles.kpiBox}>
                <SkeletonBox width="60%" height={11} />
                <SkeletonBox width="80%" height={16} style={styles.mt6} />
              </View>
            ))}
          </View>
          <SkeletonBox
            width="100%"
            height={42}
            borderRadius={radius.md}
            style={styles.mt12}
          />
        </View>

        <View style={styles.card}>
          <SkeletonBox width="34%" height={15} />
          {[0, 1, 2].map((k) => (
            <View key={k} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <SkeletonBox width="70%" height={14} />
                <SkeletonBox width="45%" height={12} style={styles.mt6} />
              </View>
              <SkeletonBox width={65} height={15} />
            </View>
          ))}
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
  card: {
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  itemLeft: {
    flex: 1,
  },
  mt6: {
    marginTop: 6,
  },
  mt8: {
    marginTop: 8,
  },
  mt12: {
    marginTop: 12,
  },
});
