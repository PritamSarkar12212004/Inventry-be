import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from '../../../core/components/SkeletonBox';
import { colors, radius, spacing } from '../../../core/theme';

const FULL_ROWS = [0, 1, 2, 3, 4, 5];
const FOOTER_ROWS = [0, 1];

export function ExpenseFooterSkeleton() {
  return (
    <View style={styles.footerWrap}>
      {FOOTER_ROWS.map((key) => (
        <View key={key} style={styles.card}>
          <SkeletonBox width={38} height={38} borderRadius={radius.sm} />
          <View style={styles.textCol}>
            <SkeletonBox width="55%" height={14} />
            <SkeletonBox width="35%" height={11} />
          </View>
          <SkeletonBox width={58} height={22} borderRadius={radius.md} />
        </View>
      ))}
    </View>
  );
}

export function ExpenseListSkeleton() {
  return (
    <View style={styles.listWrap}>
      {FULL_ROWS.map((key) => (
        <View key={key} style={styles.card}>
          <SkeletonBox width={40} height={40} borderRadius={radius.sm} />
          <View style={styles.textCol}>
            <SkeletonBox width="58%" height={15} />
            <SkeletonBox width="36%" height={12} />
          </View>
          <SkeletonBox width={62} height={24} borderRadius={radius.md} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  listWrap: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  footerWrap: {
    paddingTop: spacing.xs,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textCol: {
    flex: 1,
    gap: 6,
  },
});
