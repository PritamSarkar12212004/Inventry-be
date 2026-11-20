import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  ChevronRight,
  IndianRupee,
  Package,
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
import type { FinancialOverviewData } from '../types';

type FinancialOverviewBannerProps = {
  overview?: FinancialOverviewData;
  isLoading?: boolean;
  onPressOverview?: () => void;
};

function fmtMoney(val?: number): string {
  return `₹${Number(val || 0).toLocaleString('en-IN')}`;
}

function fmtSignedMoney(val: number): string {
  return val < 0
    ? `-₹${Math.abs(val).toLocaleString('en-IN')}`
    : fmtMoney(val);
}

export function FinancialOverviewBanner({
  overview,
  isLoading = false,
  onPressOverview,
}: FinancialOverviewBannerProps) {
  if (isLoading && !overview) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <SkeletonBox width={110} height={11} />
            <SkeletonBox width={140} height={16} style={styles.mt6} />
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
  const totalPurchases = Math.max(overview.totalPurchases || 0, 0);
  const totalExpenses = Math.max(overview.totalExpenses || 0, 0);
  const totalAllExpenses = Number(
    overview.totalAllExpenses ?? totalExpenses,
  );
  const totalMaterial = Number(
    overview.totalMaterialCost ?? overview.totalPurchases ?? 0,
  );
  const balanceAmount =
    overview.netCashflow ?? totalReceived - totalPurchases - totalExpenses;

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
          <Text style={styles.eyebrow}>FINANCIAL OVERVIEW</Text>
          <Text style={styles.heading}>Cashflow Summary</Text>
        </View>

        <View style={styles.headerRight}>
          <View
            style={[
              styles.badge,
              balanceAmount < 0 ? styles.negBadge : styles.posBadge,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                balanceAmount < 0 ? styles.negText : styles.posText,
              ]}
            >
              {collectedPct}% Collected
            </Text>
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
            {fmtMoney(totalSales)}
          </Text>
        </View>

        <View style={styles.metricTile}>
          <View style={styles.metricLabelRow}>
            <Package size={12} color={colors.primary} />
            <Text style={styles.metricLabel}>Material</Text>
          </View>
          <Text style={styles.metricVal} numberOfLines={1}>
            {fmtMoney(totalMaterial)}
          </Text>
        </View>

        <View style={styles.metricTile}>
          <View style={styles.metricLabelRow}>
            <Wallet
              size={12}
              color={balanceAmount < 0 ? colors.danger : colors.success}
            />
            <Text style={styles.metricLabel}>Balance</Text>
          </View>
          <Text
            style={[
              styles.metricVal,
              balanceAmount < 0 ? styles.negText : styles.posText,
            ]}
            numberOfLines={1}
          >
            {fmtSignedMoney(balanceAmount)}
          </Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={styles.statusChip}>
          <View style={[styles.dot, styles.greenDot]} />
          <Text style={styles.statusText} numberOfLines={1}>
            In: {fmtMoney(totalReceived)}
          </Text>
        </View>

        <View style={styles.statusChip}>
          <View style={[styles.dot, styles.amberDot]} />
          <Text style={styles.statusText} numberOfLines={1}>
            Due: {fmtMoney(overview.totalPendingDue)}
          </Text>
        </View>

        <View style={styles.statusChip}>
          <View style={[styles.dot, styles.redDot]} />
          <Text style={styles.statusText} numberOfLines={1}>
            Exp: {fmtMoney(totalAllExpenses)}
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
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  posBadge: {
    backgroundColor: colors.primarySoft,
  },
  negBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  posText: {
    color: colors.success,
  },
  negText: {
    color: colors.danger,
  },
  barTrack: {
    height: 6,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginTop: spacing.sm + 2,
    marginBottom: spacing.sm + 2,
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  metricTile: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  metricVal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 3,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginTop: spacing.sm,
  },
  statusChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
  },
  greenDot: {
    backgroundColor: colors.success,
  },
  amberDot: {
    backgroundColor: colors.warning,
  },
  redDot: {
    backgroundColor: colors.danger,
  },
  statusText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  mt6: {
    marginTop: 6,
  },
  mt12: {
    marginTop: 12,
  },
});
