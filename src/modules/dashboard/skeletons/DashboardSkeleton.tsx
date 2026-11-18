import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SkeletonBox } from '../../../core/components/SkeletonBox';
import { colors, radius, spacing } from '../../../core/theme';

export function DashboardSkeleton() {
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Quick Actions */}
      <View style={styles.quickRow}>
        {[0, 1, 2].map((k) => (
          <View key={k} style={styles.quickBtn}>
            <SkeletonBox width={34} height={34} borderRadius={radius.md} />
            <SkeletonBox width="68%" height={12} style={styles.mt8} />
          </View>
        ))}
      </View>

      {/* Financial Pulse Card */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <SkeletonBox width={100} height={10} />
            <SkeletonBox width={145} height={16} style={styles.mt6} />
          </View>
          <SkeletonBox width={86} height={24} borderRadius={radius.full} />
        </View>
        <SkeletonBox
          width="100%"
          height={6}
          borderRadius={radius.full}
          style={styles.mt12}
        />
        <View style={styles.grid2x2}>
          {[0, 1, 2, 3].map((k) => (
            <View key={k} style={styles.gridTile}>
              <SkeletonBox width="55%" height={11} />
              <SkeletonBox width="75%" height={18} style={styles.mt6} />
              <SkeletonBox width="48%" height={10} style={styles.mt4} />
            </View>
          ))}
        </View>
      </View>

      {/* Inventory Health Card */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <SkeletonBox width={110} height={10} />
            <SkeletonBox width={135} height={16} style={styles.mt6} />
          </View>
          <SkeletonBox width={80} height={24} borderRadius={radius.full} />
        </View>
        <SkeletonBox
          width="100%"
          height={6}
          borderRadius={radius.full}
          style={styles.mt12}
        />
        <View style={styles.row3}>
          {[0, 1, 2].map((k) => (
            <View key={k} style={styles.tile3}>
              <SkeletonBox width="65%" height={11} />
              <SkeletonBox width="50%" height={17} style={styles.mt6} />
            </View>
          ))}
        </View>
      </View>

      {/* List Section Card */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <SkeletonBox width={150} height={15} />
          <SkeletonBox width={60} height={13} />
        </View>
        {[0, 1, 2].map((k) => (
          <View key={k} style={styles.listRow}>
            <SkeletonBox width={38} height={38} borderRadius={radius.full} />
            <View style={styles.listMeta}>
              <SkeletonBox width="60%" height={14} />
              <SkeletonBox width="40%" height={11} style={styles.mt6} />
            </View>
            <SkeletonBox width={64} height={15} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 2,
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginTop: spacing.sm + 2,
  },
  gridTile: {
    width: '48.5%',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
  },
  row3: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginTop: spacing.sm + 2,
  },
  tile3: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  listMeta: {
    flex: 1,
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
  mt12: {
    marginTop: 12,
  },
});
