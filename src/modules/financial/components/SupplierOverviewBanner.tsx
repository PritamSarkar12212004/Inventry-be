import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  ChevronRight,
  Receipt,
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
import type { PurchaseExpenseSummaryResponse } from '../types';

type SupplierOverviewBannerProps = {
  summary?: PurchaseExpenseSummaryResponse['summary'];
  suppliersCount?: number;
  isLoading?: boolean;
  onPressOverview?: () => void;
};

function fmtMoney(val?: number): string {
  return `₹${Number(val || 0).toLocaleString('en-IN')}`;
}

export function SupplierOverviewBanner({
  summary,
  suppliersCount = 0,
  isLoading = false,
  onPressOverview,
}: SupplierOverviewBannerProps) {
  if (isLoading && !summary) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <SkeletonBox width={115} height={11} />
            <SkeletonBox width={135} height={16} style={styles.mt6} />
          </View>
          <SkeletonBox width={78} height={24} borderRadius={radius.full} />
        </View>
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

  if (!summary) return null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPressOverview}
      activeOpacity={0.85}
      disabled={!onPressOverview}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>SUPPLIERS &amp; PURCHASES</Text>
          <Text style={styles.heading}>Spend Summary</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {summary.totalPurchaseEntries ?? 0} Bills
            </Text>
          </View>
          {onPressOverview ? (
            <ChevronRight size={16} color={colors.textMuted} />
          ) : null}
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricTile}>
          <View style={styles.metricLabelRow}>
            <ShoppingBag size={12} color={colors.primary} />
            <Text style={styles.metricLabel}>Purchases</Text>
          </View>
          <Text style={styles.metricVal} numberOfLines={1}>
            {fmtMoney(summary.totalPurchases)}
          </Text>
        </View>

        <View style={styles.metricTile}>
          <View style={styles.metricLabelRow}>
            <Receipt size={12} color={colors.warning} />
            <Text style={styles.metricLabel}>Expenses</Text>
          </View>
          <Text style={[styles.metricVal, styles.warningText]} numberOfLines={1}>
            {fmtMoney(summary.totalAllExpenses)}
          </Text>
        </View>

        <View style={styles.metricTile}>
          <View style={styles.metricLabelRow}>
            <Wallet size={12} color={colors.primary} />
            <Text style={styles.metricLabel}>Outflow</Text>
          </View>
          <Text style={styles.metricVal} numberOfLines={1}>
            {fmtMoney(summary.grandTotalSpend)}
          </Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={styles.statusChip}>
          <View style={[styles.dot, styles.blueDot]} />
          <Text style={styles.statusText} numberOfLines={1}>
            Mat: {fmtMoney(summary.totalMaterialCost)}
          </Text>
        </View>

        <View style={styles.statusChip}>
          <View style={[styles.dot, styles.amberDot]} />
          <Text style={styles.statusText} numberOfLines={1}>
            Tr: {fmtMoney(summary.totalTransportCost)}
          </Text>
        </View>

        <View style={styles.statusChip}>
          <View style={[styles.dot, styles.greenDot]} />
          <Text style={styles.statusText} numberOfLines={1}>
            Sup: {suppliersCount}
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
    marginBottom: spacing.sm + 2,
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
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.primary,
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
  warningText: {
    color: colors.warning,
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
  blueDot: {
    backgroundColor: colors.primary,
  },
  amberDot: {
    backgroundColor: colors.warning,
  },
  greenDot: {
    backgroundColor: colors.success,
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
});
