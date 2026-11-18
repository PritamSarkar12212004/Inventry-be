import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SkeletonBox } from '../../../core/components/SkeletonBox';
import { colors, radius, spacing } from '../../../core/theme';
import { inventoryStyles } from '../../inventory/styles';

type CustomerListSkeletonProps = {
  count?: number;
};

export function CustomerListSkeleton({ count = 6 }: CustomerListSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <ScrollView
      contentContainerStyle={inventoryStyles.listContent}
      showsVerticalScrollIndicator={false}
    >
      {items.map((key) => (
        <View key={key} style={styles.card}>
          <View style={styles.topRow}>
            <SkeletonBox width={40} height={40} borderRadius={radius.full} />
            <View style={styles.infoCol}>
              <SkeletonBox width="62%" height={15} />
              <SkeletonBox width="38%" height={12} style={styles.mt6} />
              <SkeletonBox width="75%" height={11} style={styles.mt4} />
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statsLeft}>
              <SkeletonBox width={60} height={12} />
              <SkeletonBox width={88} height={18} borderRadius={radius.full} />
            </View>
            <SkeletonBox width={70} height={15} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoCol: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  mt4: {
    marginTop: 4,
  },
  mt6: {
    marginTop: 6,
  },
});
