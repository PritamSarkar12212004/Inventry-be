import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  ChevronRight,
  IndianRupee,
  ShoppingBag,
  Wallet,
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
import type { FinancialOverviewData } from '../../financial/types';

type SalesOverviewBannerProps = {
  overview?: FinancialOverviewData;
  isLoading?: boolean;
  onPressOverview?: () => void;
};

function fmtCompact(val?: number): string {
  return `₹${Number(val || 0).toLocaleString('en-IN')}`;
}

export function SalesOverviewBanner({
  overview,
  isLoading = false,
  onPressOverview,
}: SalesOverviewBannerProps) {
  if (isLoading && !overview) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <SkeletonBox width={100} height={11} />
            <SkeletonBox width={130} height={16} style={styles.mt6} />
          </View>
          <SkeletonBox width={88} height={24} borderRadius={radius.full} />
        </View>
        <SkeletonBox
          width="100%"
          height={6}
          borderRadius={radius.full}
          style={styles.mt12}
        />
        <View style={styles.metricsRow}>
          {[0, 1, 2].map((k) => (
            <View key={k} style={styles.metricTile}>
              <SkeletonBox width="65%" height={11} />
              <SkeletonBox width="55%" height={18} style={styles.mt6} />
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

  if (!overview) return null;

  const totalSales = Math.max(overview.totalSales || 0, 0);
  const totalReceived = Math.max(overview.totalReceived || 0, 0);
  const collectedPct =
    totalSales > 0
      ? Math.min(100, Math.round((totalReceived / totalSales) * 100))
      : 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPressOverview}
      activeOpacity={0.85}
      disabled={!onPressOverview}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>SALES OVERVIEW</Text>
          <Text style={styles.heading}>Orders Summary</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{collectedPct}% Collected</Text>
          </View>
          {onPressOverview ? (
            <ChevronRight size={16} color={colors.textMuted} />
          ) : null}
        </View>
      </View>

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${collectedPct}%` }]} />
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricTile}>
          <View style={styles.metricLabelRow}>
            <IndianRupee size={12} color={colors.primary} />
            <Text style={styles.metricLabel}>Total Sales</Text>
          </View>
          <Text style={styles.metricVal} numberOfLines={1}>
            {fmtCompact(overview.totalSales)}
          </Text>
        </View>

        <View style={styles.metricTile}>
          <View style={styles.metricLabelRow}>
            <ShoppingBag size={12} color={colors.primary} />
            <Text style={styles.metricLabel}>Orders</Text>
          </View>
          <Text style={styles.metricVal}>{overview.totalOrders ?? 0}</Text>
        </View>

        <View style={styles.metricTile}>
          <View style={styles.metricLabelRow}>
            <Wallet size={12} color={colors.primary} />
            <Text style={styles.metricLabel}>Pending</Text>
          </View>
          <Text style={styles.metricVal} numberOfLines={1}>
            {fmtCompact(overview.totalPendingDue)}
          </Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={styles.statusChip}>
          <View style={[styles.dot, styles.paidDot]} />
          <Text style={styles.statusText}>
            Paid: {overview.paidOrdersCount ?? 0}
          </Text>
        </View>

        <View style={styles.statusChip}>
          <View style={[styles.dot, styles.partialDot]} />
          <Text style={styles.statusText}>
            Partial: {overview.partialOrdersCount ?? 0}
          </Text>
        </View>

        <View style={styles.statusChip}>
          <View style={[styles.dot, styles.unpaidDot]} />
          <Text style={styles.statusText}>
            Unpaid: {overview.unpaidOrdersCount ?? 0}
          </Text>
        </View>
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
  badge: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: {
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
    fontSize: fontSize.sm + 1,
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
  paidDot: {
    backgroundColor: colors.success,
  },
  partialDot: {
    backgroundColor: colors.warning,
  },
  unpaidDot: {
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
