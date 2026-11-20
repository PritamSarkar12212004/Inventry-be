import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Boxes,
  ChevronRight,
  Clock,
  IndianRupee,
  Package,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Truck,
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
import {
  useFinancialOverview,
  usePurchaseExpenseSummary,
} from '../hooks';

function fmtMoney(val?: number): string {
  return `₹${Number(val || 0).toLocaleString('en-IN')}`;
}

function fmtSignedMoney(val: number): string {
  return val < 0
    ? `-₹${Math.abs(val).toLocaleString('en-IN')}`
    : fmtMoney(val);
}

type OverviewListRow = {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: string;
  onPress?: () => void;
};

type OverviewSection = {
  title: string;
  rows: OverviewListRow[];
};

export function FinancialOverviewDetailScreen() {
  const navigation = useNavigation();
  const {
    data: overview,
    isLoading: overviewLoading,
    isRefetching: overviewRefetching,
    refetch: refetchOverview,
  } = useFinancialOverview();

  const {
    data: purchaseData,
    isRefetching: purchaseRefetching,
    refetch: refetchPurchase,
  } = usePurchaseExpenseSummary();

  const navAny = navigation as unknown as {
    navigate: (name: string, params?: Record<string, unknown>) => void;
  };

  if (overviewLoading && !overview) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <SkeletonBox width="100%" height={92} borderRadius={radius.lg} />
          <SkeletonBox
            width="100%"
            height={180}
            borderRadius={radius.lg}
            style={styles.mt12}
          />
          <SkeletonBox
            width="100%"
            height={210}
            borderRadius={radius.lg}
            style={styles.mt12}
          />
          <SkeletonBox
            width="100%"
            height={150}
            borderRadius={radius.lg}
            style={styles.mt12}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const totalSales = Number(overview?.totalSales || 0);
  const totalReceived = Number(overview?.totalReceived || 0);
  const totalPurchases = Number(overview?.totalPurchases || 0);
  const totalExpenses = Number(overview?.totalExpenses || 0);
  const totalMaterial = Number(
    overview?.totalMaterialCost ?? overview?.totalPurchases ?? 0,
  );
  const totalOutflow = totalPurchases + totalExpenses;
  const balanceAmount = overview?.netCashflow ?? totalReceived - totalOutflow;
  const collectedPct =
    totalSales > 0
      ? Math.min(100, Math.round((totalReceived / totalSales) * 100))
      : 0;

  const pSummary = purchaseData?.summary;
  const purchaseTransport = Number(
    overview?.totalPurchaseTransportCost ?? pSummary?.totalTransportCost ?? 0,
  );
  const purchaseOther = Number(
    overview?.totalPurchaseOtherCost ?? pSummary?.totalOtherPurchaseCost ?? 0,
  );
  const purchaseExpenses = Number(
    overview?.totalPurchaseExpenses ?? purchaseTransport + purchaseOther,
  );
  const inHouseExpenses = Number(overview?.totalInHouseExpenses || 0);
  const otherStandaloneExpenses = Math.max(0, totalExpenses - inHouseExpenses);
  const totalAllExpenses = Number(
    overview?.totalAllExpenses ?? totalExpenses + purchaseExpenses,
  );

  const sections: OverviewSection[] = [
    {
      title: 'REVENUE & RECEIVABLES',
      rows: [
        {
          label: 'Total Sales',
          value: fmtMoney(totalSales),
          icon: <TrendingUp size={17} color={colors.primary} />,
          accent: colors.primary,
          onPress: () =>
            navAny.navigate('Main', {
              screen: 'SalesTab',
              params: { screen: 'SalesOrders' },
            }),
        },
        {
          label: 'Total Received',
          value: fmtMoney(totalReceived),
          icon: <IndianRupee size={17} color={colors.success} />,
          accent: colors.success,
        },
        {
          label: 'Pending Receivable',
          value: fmtMoney(overview?.totalPendingDue),
          icon: <Clock size={17} color={colors.warning} />,
          accent: colors.warning,
          onPress: () => navAny.navigate('Main', { screen: 'ReceiveTab' }),
        },
      ],
    },
    {
      title: 'MATERIAL & PURCHASES',
      rows: [
        {
          label: 'Total Purchases',
          value: fmtMoney(totalPurchases),
          icon: <ShoppingBag size={17} color={colors.textPrimary} />,
          onPress: () =>
            navAny.navigate('Main', {
              screen: 'SalesTab',
              params: { screen: 'Suppliers' },
            }),
        },
        {
          label: 'Material Cost',
          value: fmtMoney(totalMaterial),
          icon: <Package size={17} color={colors.primary} />,
        },
        {
          label: 'Purchase Transport',
          value: fmtMoney(purchaseTransport),
          icon: <Truck size={17} color={colors.textSecondary} />,
        },
        {
          label: 'Other Purchase Costs',
          value: fmtMoney(purchaseOther),
          icon: <Receipt size={17} color={colors.textSecondary} />,
        },
      ],
    },
    {
      title: 'EXPENSES BREAKDOWN',
      rows: [
        {
          label: 'In-House Expenses',
          value: fmtMoney(inHouseExpenses),
          icon: <Receipt size={17} color={colors.primary} />,
          accent: colors.primary,
          onPress: () =>
            navAny.navigate('Main', {
              screen: 'SalesTab',
              params: { screen: 'Suppliers' },
            }),
        },
        {
          label: 'Purchase Expenses',
          value: fmtMoney(purchaseExpenses),
          icon: <Truck size={17} color={colors.warning} />,
          accent: colors.warning,
          onPress: () =>
            navAny.navigate('Main', {
              screen: 'SalesTab',
              params: { screen: 'Suppliers' },
            }),
        },
        ...(otherStandaloneExpenses > 0
          ? [
              {
                label: 'Other Expenses',
                value: fmtMoney(otherStandaloneExpenses),
                icon: <Receipt size={17} color={colors.textSecondary} />,
              },
            ]
          : []),
        {
          label: 'Total All Expenses',
          value: fmtMoney(totalAllExpenses),
          icon: <Receipt size={17} color={colors.danger} />,
          accent: colors.danger,
        },
      ],
    },
    {
      title: 'STOCK & BALANCE',
      rows: [
        {
          label: 'Total Stock Value',
          value: fmtMoney(overview?.totalStockValue),
          icon: <Boxes size={17} color={colors.primary} />,
          accent: colors.primary,
          onPress: () => navAny.navigate('StockOverviewDetail'),
        },
        {
          label: 'Total Outflow',
          value: fmtMoney(totalOutflow),
          icon: <Wallet size={17} color={colors.textSecondary} />,
        },
        {
          label: 'Balance Amount',
          value: fmtSignedMoney(balanceAmount),
          icon: (
            <Wallet
              size={17}
              color={balanceAmount < 0 ? colors.danger : colors.success}
            />
          ),
          accent: balanceAmount < 0 ? colors.danger : colors.success,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={overviewRefetching || purchaseRefetching}
            onRefresh={() => {
              refetchOverview();
              refetchPurchase();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.healthBanner}>
          <View style={styles.healthTopRow}>
            <View>
              <Text style={styles.eyebrow}>FINANCIAL HEALTH</Text>
              <Text style={styles.bannerTitle}>Net Balance Summary</Text>
            </View>
            <View
              style={[
                styles.healthBadge,
                balanceAmount < 0 ? styles.negBadge : styles.posBadge,
              ]}
            >
              <Text
                style={[
                  styles.healthText,
                  balanceAmount < 0 ? styles.negText : styles.posText,
                ]}
              >
                {collectedPct}% Collected
              </Text>
            </View>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${collectedPct}%` }]} />
          </View>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.listCard}>
              {section.rows.map((row, idx) => {
                const rowStyle = [
                  styles.listRow,
                  idx === section.rows.length - 1 && styles.listRowLast,
                ];
                const content = (
                  <>
                    <View style={styles.rowLeft}>
                      <View style={styles.iconWrap}>{row.icon}</View>
                      <Text style={styles.rowLabel} numberOfLines={1}>
                        {row.label}
                      </Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text
                        style={[
                          styles.rowValue,
                          row.accent ? { color: row.accent } : null,
                        ]}
                        numberOfLines={1}
                      >
                        {row.value}
                      </Text>
                      {row.onPress ? (
                        <ChevronRight size={16} color={colors.textMuted} />
                      ) : null}
                    </View>
                  </>
                );

                return row.onPress ? (
                  <TouchableOpacity
                    key={row.label}
                    style={rowStyle}
                    onPress={row.onPress}
                    activeOpacity={0.75}
                  >
                    {content}
                  </TouchableOpacity>
                ) : (
                  <View key={row.label} style={rowStyle}>
                    {content}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  mt12: {
    marginTop: spacing.md,
  },
  healthBanner: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  healthTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    letterSpacing: 0.7,
  },
  bannerTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  healthBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  posBadge: {
    backgroundColor: colors.primarySoft,
  },
  negBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  healthText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  posText: {
    color: colors.primary,
  },
  negText: {
    color: colors.danger,
  },
  barTrack: {
    height: 8,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginTop: spacing.sm + 4,
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  sectionBlock: {
    gap: spacing.xs + 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 0.7,
    paddingHorizontal: 4,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  listRowLast: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
});
