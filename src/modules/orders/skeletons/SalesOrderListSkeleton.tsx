import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SkeletonBox } from '../../../core/components/SkeletonBox';
import { colors, radius, spacing } from '../../../core/theme';
import { inventoryStyles } from '../../inventory/styles';

type SalesOrderListSkeletonProps = {
  count?: number;
  embedded?: boolean;
};

export function SalesOrderListSkeleton({
  count = 6,
  embedded = false,
}: SalesOrderListSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  const content = (
    <View style={embedded ? styles.embeddedWrap : undefined}>
      {items.map((key) => (
        <View key={key} style={styles.card}>
          <View style={styles.rowBetween}>
            <SkeletonBox width={115} height={15} />
            <SkeletonBox width={74} height={22} borderRadius={radius.full} />
          </View>

          <SkeletonBox width="58%" height={14} style={styles.mt8} />
          <SkeletonBox width="40%" height={12} style={styles.mt6} />

          <View style={styles.footerRow}>
            <SkeletonBox width={72} height={13} />
            <SkeletonBox width={82} height={15} />
          </View>
        </View>
      ))}
    </View>
  );

  if (embedded) return content;

  return (
    <ScrollView
      contentContainerStyle={inventoryStyles.listContent}
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  embeddedWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  mt6: {
    marginTop: 6,
  },
  mt8: {
    marginTop: 8,
  },
});
