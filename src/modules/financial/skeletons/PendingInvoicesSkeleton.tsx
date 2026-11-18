import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from '../../../core/components/SkeletonBox';
import { colors, radius, spacing } from '../../../core/theme';

const INVOICE_PLACEHOLDERS = [0, 1, 2, 3];

export function PendingInvoicesSkeleton() {
  return (
    <View style={styles.listWrap}>
      {INVOICE_PLACEHOLDERS.map((key) => (
        <View key={key} style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.badgeRow}>
              <SkeletonBox width={105} height={15} />
              <SkeletonBox width={54} height={18} borderRadius={radius.full} />
              <SkeletonBox width={42} height={18} borderRadius={radius.full} />
            </View>
            <SkeletonBox width={68} height={12} />
          </View>

          <View style={styles.itemsBox}>
            <View style={styles.rowBetween}>
              <SkeletonBox width="58%" height={12} />
              <SkeletonBox width={46} height={12} />
            </View>
            <View style={styles.rowBetween}>
              <SkeletonBox width="48%" height={12} />
              <SkeletonBox width={46} height={12} />
            </View>
          </View>

          <SkeletonBox
            width="100%"
            height={4}
            borderRadius={radius.full}
            style={styles.mt10}
          />

          <View style={styles.amountsRow}>
            {[0, 1, 2].map((col) => (
              <View key={col} style={styles.amountCol}>
                <SkeletonBox width={54} height={11} />
                <SkeletonBox width={66} height={14} style={styles.mt4} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listWrap: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
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
    gap: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemsBox: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 6,
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  amountCol: {
    gap: 2,
  },
  mt4: {
    marginTop: 4,
  },
  mt10: {
    marginTop: 10,
  },
});
