import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SkeletonBox } from '../../../core/components/SkeletonBox';
import { colors, radius, spacing } from '../../../core/theme';
import { inventoryStyles } from '../styles';

type StockListSkeletonProps = {
  viewMode?: 'list' | 'grid';
  count?: number;
};

const LIST_PLACEHOLDERS = [0, 1, 2, 3, 4, 5];
const GRID_PLACEHOLDERS = [0, 1, 2, 3, 4, 5];

export function StockListSkeleton({
  viewMode = 'list',
  count,
}: StockListSkeletonProps) {
  if (viewMode === 'grid') {
    const items = count
      ? Array.from({ length: count }, (_, i) => i)
      : GRID_PLACEHOLDERS;

    return (
      <ScrollView
        contentContainerStyle={styles.gridWrap}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridRow}>
          {items.map((key) => (
            <View key={key} style={styles.gridCard}>
              <SkeletonBox
                width="100%"
                height={110}
                borderRadius={0}
              />
              <View style={styles.gridBody}>
                <SkeletonBox width="78%" height={15} />
                <SkeletonBox width="45%" height={13} style={styles.mt6} />
                <SkeletonBox width="55%" height={12} style={styles.mt4} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  const items = count
    ? Array.from({ length: count }, (_, i) => i)
    : LIST_PLACEHOLDERS;

  return (
    <ScrollView
      contentContainerStyle={inventoryStyles.listContent}
      showsVerticalScrollIndicator={false}
    >
      {items.map((key) => (
        <View key={key} style={inventoryStyles.card}>
          <View style={inventoryStyles.cardBodyRow}>
            <SkeletonBox width={54} height={54} borderRadius={radius.md} />

            <View style={inventoryStyles.cardInfoCol}>
              <View style={styles.topRow}>
                <View style={styles.titleCol}>
                  <SkeletonBox width="72%" height={15} />
                  <View style={styles.metaRow}>
                    <SkeletonBox width={68} height={12} />
                    <SkeletonBox
                      width={76}
                      height={16}
                      borderRadius={radius.full}
                    />
                  </View>
                </View>
                <SkeletonBox
                  width={64}
                  height={22}
                  borderRadius={radius.full}
                />
              </View>

              <SkeletonBox
                width="100%"
                height={6}
                borderRadius={radius.full}
                style={styles.mt10}
              />

              <View style={styles.bottomRow}>
                <SkeletonBox width={82} height={13} />
                <SkeletonBox width={82} height={13} />
              </View>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleCol: {
    flex: 1,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  gridWrap: {
    padding: spacing.lg,
    paddingBottom: 96,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  gridCard: {
    width: '47.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  gridBody: {
    padding: spacing.sm + 2,
  },
  mt4: {
    marginTop: 4,
  },
  mt6: {
    marginTop: 6,
  },
  mt10: {
    marginTop: 10,
  },
});
