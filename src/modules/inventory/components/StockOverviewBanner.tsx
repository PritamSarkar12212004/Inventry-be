import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Boxes,
  ChevronRight,
  FolderKanban,
  Layers,
} from 'lucide-react-native';
import { SkeletonBox } from '../../../core/components/SkeletonBox';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from '../../../core/theme';
import type { InventorySummaryData } from '../types';

type StockOverviewBannerProps = {
  summary?: InventorySummaryData;
  isLoading?: boolean;
  onPressOverview?: () => void;
  onPressAlerts?: () => void;
};

export function StockOverviewBanner({
  summary,
  isLoading = false,
  onPressOverview,
  onPressAlerts,
}: StockOverviewBannerProps) {
  if (isLoading && !summary) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <SkeletonBox width={110} height={11} />
            <SkeletonBox width={140} height={16} style={styles.mt6} />
          </View>
          <SkeletonBox width={78} height={24} borderRadius={radius.full} />
        </View>
        <SkeletonBox
          width="100%"
          height={7}
          borderRadius={radius.full}
          style={styles.mt12}
        />
        <View style={styles.metricsRow}>
          {[0, 1, 2].map((k) => (
            <View key={k} style={styles.metricTile}>
              <SkeletonBox width="65%" height={11} />
              <SkeletonBox width="50%" height={18} style={styles.mt6} />
            </View>
          ))}
        </View>
        <View style={styles.statusRow}>
          <SkeletonBox width="31%" height={28} borderRadius={radius.sm} />
          <SkeletonBox width="31%" height={28} borderRadius={radius.sm} />
          <SkeletonBox width="31%" height={28} borderRadius={radius.sm} />
        </View>
      </View>
    );
  }

  if (!summary) return null;

  const totalProducts = Math.max(summary.totalProducts ?? 0, 0);
  const inStock = Math.max(summary.inStockCount ?? 0, 0);
  const lowStock = Math.max(summary.lowStockCount ?? 0, 0);
  const outStock = Math.max(summary.outOfStockCount ?? 0, 0);

  const healthyPct =
    totalProducts > 0 ? Math.round((inStock / totalProducts) * 100) : 100;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPressOverview}
      activeOpacity={0.85}
      disabled={!onPressOverview}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>INVENTORY OVERVIEW</Text>
          <Text style={styles.heading}>Stock Summary</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.healthBadge}>
            <Text style={styles.healthText}>{healthyPct}% Healthy</Text>
          </View>
          {onPressOverview ? (
            <ChevronRight size={16} color={colors.textMuted} />
          ) : null}
        </View>
      </View>

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${healthyPct}%` }]} />
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricTile}>
          <View style={styles.metricLabelRow}>
            <Boxes size={13} color={colors.primary} />
            <Text style={styles.metricLabel}>Total Units</Text>
          </View>
          <Text style={styles.metricVal} numberOfLines={1}>
            {Number(summary.totalStockQuantity || 0).toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={styles.metricTile}>
          <View style={styles.metricLabelRow}>
            <Layers size={13} color={colors.primary} />
            <Text style={styles.metricLabel}>Products</Text>
          </View>
          <Text style={styles.metricVal}>{totalProducts}</Text>
        </View>

        <View style={styles.metricTile}>
          <View style={styles.metricLabelRow}>
            <FolderKanban size={13} color={colors.primary} />
            <Text style={styles.metricLabel}>Categories</Text>
          </View>
          <Text style={styles.metricVal}>{summary.totalCategories ?? 0}</Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={styles.statusChip}>
          <View style={[styles.dot, styles.inStockDot]} />
          <Text style={styles.statusText}>In: {inStock}</Text>
        </View>

        <TouchableOpacity
          style={styles.statusChip}
          onPress={onPressAlerts}
          activeOpacity={0.75}
        >
          <View style={[styles.dot, styles.lowDot]} />
          <Text style={styles.statusText}>Low: {lowStock}</Text>
          <ChevronRight size={12} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statusChip}
          onPress={onPressAlerts}
          activeOpacity={0.75}
        >
          <View style={[styles.dot, styles.outDot]} />
          <Text style={styles.statusText}>Out: {outStock}</Text>
          <ChevronRight size={12} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm + 2,
    ...shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 0.7,
  },
  heading: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 1,
  },
  healthBadge: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  healthText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  barTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfacePressed,
    overflow: 'hidden',
    marginTop: spacing.sm + 2,
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginTop: spacing.sm + 2,
  },
  metricTile: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  metricVal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginTop: spacing.sm + 2,
  },
  statusChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
  },
  inStockDot: {
    backgroundColor: colors.success,
  },
  lowDot: {
    backgroundColor: colors.warning,
  },
  outDot: {
    backgroundColor: colors.danger,
  },
  statusText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  mt6: {
    marginTop: 6,
  },
  mt12: {
    marginTop: 12,
  },
});
