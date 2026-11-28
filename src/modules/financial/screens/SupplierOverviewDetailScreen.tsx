import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Package,
  Receipt,
  ShoppingBag,
  Truck,
  Wallet,
  X,
} from 'lucide-react-native';
import { SkeletonBox } from '../../../core/components/SkeletonBox';
import type { RootStackParamList } from '../../../core/navigation/types';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from '../../../core/theme';
import { usePurchaseExpenseSummary } from '../hooks';
import type { ExpenseBreakdownItem } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

function fmtMoney(val?: number): string {
  return `₹${Number(val || 0).toLocaleString('en-IN')}`;
}

type OverviewListRow = {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: string;
  onPress?: () => void;
};

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function getMonthRange(year: number, month: number | null) {
  if (month === null) {
    return {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      label: `Year ${year}`,
    };
  }
  const lastDay = new Date(year, month, 0).getDate();
  const mm = String(month).padStart(2, '0');
  return {
    startDate: `${year}-${mm}-01`,
    endDate: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
    label: `${MONTH_NAMES[month - 1] ?? ''} ${year}`,
  };
}

export function SupplierOverviewDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const now = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState<{
    year: number;
    month: number | null;
  } | null>(null);
  const [pickerYear, setPickerYear] = useState<number>(() =>
    now.getFullYear(),
  );
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const monthRange = useMemo(
    () =>
      selectedMonth
        ? getMonthRange(selectedMonth.year, selectedMonth.month)
        : null,
    [selectedMonth],
  );
  const periodLabel = monthRange?.label ?? 'All Time';

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerCalBtn}
          activeOpacity={0.75}
          onPress={() => {
            setPickerYear(selectedMonth?.year ?? now.getFullYear());
            setFilterModalOpen(true);
          }}
        >
          <Calendar size={17} color={colors.textPrimary} />
          <Text style={styles.headerCalText}>{periodLabel}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, periodLabel, selectedMonth, now]);

  const { data, isLoading, isRefetching, refetch } =
    usePurchaseExpenseSummary(
      undefined,
      monthRange?.startDate,
      monthRange?.endDate,
    );

  const summary = data?.summary;
  const expenseBreakdown = data?.expenseBreakdown ?? [];
  const allPurchases = data?.purchases ?? [];

  if (isLoading && !data) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <SkeletonBox width="100%" height={84} borderRadius={radius.lg} />
          <SkeletonBox
            width="100%"
            height={210}
            borderRadius={radius.lg}
            style={styles.mt12}
          />
          <SkeletonBox
            width="100%"
            height={170}
            borderRadius={radius.lg}
            style={styles.mt12}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const handleOpenAllPurchases = () => {
    navigation.navigate('SupplierPurchaseDetail', {
      title: 'All Purchases',
      subtitle: `${summary?.totalPurchaseEntries ?? 0} purchase entries`,
      mode: 'ALL_PURCHASES',
      purchases: allPurchases,
      summaryStats: {
        totalAmount: summary?.totalPurchases ?? 0,
        materialCost: summary?.totalMaterialCost ?? 0,
        transportCost: summary?.totalTransportCost ?? 0,
        otherCost: summary?.totalOtherPurchaseCost ?? 0,
        count: summary?.totalPurchaseEntries ?? 0,
      },
    });
  };

  const handleOpenExpenseCategory = (cat: ExpenseBreakdownItem) => {
    navigation.navigate('SupplierPurchaseDetail', {
      title: `${cat.label} Expenses`,
      subtitle: `${cat.count} ${cat.count === 1 ? 'entry' : 'entries'}`,
      mode: 'EXPENSE_CATEGORY',
      category: cat,
    });
  };

  const purchaseRows: OverviewListRow[] = [
    {
      label: 'Total Purchases',
      value: fmtMoney(summary?.totalPurchases),
      icon: <ShoppingBag size={17} color={colors.primary} />,
      accent: colors.primary,
      onPress: handleOpenAllPurchases,
    },
    {
      label: 'Material Cost',
      value: fmtMoney(summary?.totalMaterialCost),
      icon: <Package size={17} color={colors.textPrimary} />,
    },
    {
      label: 'Transport Cost',
      value: fmtMoney(summary?.totalTransportCost),
      icon: <Truck size={17} color={colors.textSecondary} />,
    },
    {
      label: 'Other Purchase Costs',
      value: fmtMoney(summary?.totalOtherPurchaseCost),
      icon: <Receipt size={17} color={colors.textSecondary} />,
    },
  ];

  const outflowRows: OverviewListRow[] = [
    {
      label: 'Total All Expenses',
      value: fmtMoney(summary?.totalAllExpenses),
      icon: <Receipt size={17} color={colors.warning} />,
      accent: colors.warning,
    },
    {
      label: 'Total Outflow (Purchases + Expenses)',
      value: fmtMoney(summary?.grandTotalSpend),
      icon: <Wallet size={17} color={colors.primary} />,
      accent: colors.primary,
    },
  ];

  const renderSection = (title: string, rows: OverviewListRow[]) => (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.listCard}>
        {rows.map((row, idx) => {
          const rowStyle = [
            styles.listRow,
            idx === rows.length - 1 && styles.listRowLast,
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
  );

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.banner}>
          <View>
            <Text style={styles.eyebrow}>PURCHASES &amp; EXPENSES</Text>
            <Text style={styles.bannerTitle}>Supplier Spend Overview</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {summary?.totalPurchaseEntries ?? 0} Bills
            </Text>
          </View>
        </View>

        {renderSection('PURCHASES SUMMARY', purchaseRows)}

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>EXPENSES BREAKDOWN</Text>
          <View style={styles.listCard}>
            {expenseBreakdown.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>
                  No transport or other expenses recorded yet.
                </Text>
              </View>
            ) : (
              expenseBreakdown.map((cat, idx) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.listRow,
                    idx === expenseBreakdown.length - 1 && styles.listRowLast,
                  ]}
                  onPress={() => handleOpenExpenseCategory(cat)}
                  activeOpacity={0.75}
                >
                  <View style={styles.rowLeft}>
                    <View style={styles.iconWrap}>
                      {cat.key === 'TRANSPORT' ? (
                        <Truck size={17} color={colors.primary} />
                      ) : cat.key === 'RAW_MATERIAL' || cat.key === 'PACKAGING' ? (
                        <Package size={17} color={colors.primary} />
                      ) : (
                        <Receipt size={17} color={colors.primary} />
                      )}
                    </View>
                    <View style={styles.catTextWrap}>
                      <Text style={styles.rowLabel} numberOfLines={1}>
                        {cat.label}
                      </Text>
                      <Text style={styles.catCount}>
                        {cat.count} {cat.count === 1 ? 'record' : 'records'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={styles.rowValue} numberOfLines={1}>
                      {fmtMoney(cat.totalAmount)}
                    </Text>
                    <ChevronRight size={16} color={colors.textMuted} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {renderSection('TOTAL OUTFLOW', outflowRows)}
      </ScrollView>

      <Modal
        visible={filterModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalOpen(false)}
      >
        <Pressable
          style={styles.filterModalBackdrop}
          onPress={() => setFilterModalOpen(false)}
        >
          <Pressable style={styles.filterModalCard} onPress={() => {}}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Select Period</Text>
              <TouchableOpacity
                onPress={() => setFilterModalOpen(false)}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.yearSwitchRow}>
              <TouchableOpacity
                onPress={() => setPickerYear((y) => y - 1)}
                style={styles.yearArrowBtn}
                activeOpacity={0.7}
              >
                <ChevronLeft size={18} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.yearText}>{pickerYear}</Text>
              {pickerYear < now.getFullYear() ? (
                <TouchableOpacity
                  onPress={() => setPickerYear((y) => y + 1)}
                  style={styles.yearArrowBtn}
                  activeOpacity={0.7}
                >
                  <ChevronRight size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              ) : (
                <View style={styles.yearArrowPlaceholder} />
              )}
            </View>

            <View style={styles.monthGrid}>
              {MONTH_NAMES.map((mName, idx) => {
                const isFuture =
                  pickerYear > now.getFullYear() ||
                  (pickerYear === now.getFullYear() && idx > now.getMonth());
                if (isFuture) {
                  return null;
                }
                const isSelected =
                  selectedMonth?.year === pickerYear &&
                  selectedMonth?.month === idx;
                const isCurrent =
                  now.getFullYear() === pickerYear && now.getMonth() === idx;

                return (
                  <TouchableOpacity
                    key={mName}
                    style={[
                      styles.monthCell,
                      isCurrent && !isSelected && styles.monthCellCurrent,
                      isSelected && styles.monthCellActive,
                    ]}
                    onPress={() => {
                      setSelectedMonth({ year: pickerYear, month: idx });
                      setFilterModalOpen(false);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.monthCellText,
                        isCurrent && !isSelected && styles.monthCellTextCurrent,
                        isSelected && styles.monthCellTextActive,
                      ]}
                    >
                      {mName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.footerActionsRow}>
              <TouchableOpacity
                style={[
                  styles.allTimeBtn,
                  styles.footerActionBtn,
                  selectedMonth?.year === pickerYear &&
                    selectedMonth?.month === null &&
                    styles.allTimeBtnActive,
                ]}
                onPress={() => {
                  setSelectedMonth({ year: pickerYear, month: null });
                  setFilterModalOpen(false);
                }}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.allTimeBtnText,
                    selectedMonth?.year === pickerYear &&
                      selectedMonth?.month === null &&
                      styles.allTimeBtnTextActive,
                  ]}
                >
                  Full Year {pickerYear}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.allTimeBtn,
                  styles.footerActionBtn,
                  selectedMonth === null && styles.allTimeBtnActive,
                ]}
                onPress={() => {
                  setSelectedMonth(null);
                  setFilterModalOpen(false);
                }}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.allTimeBtnText,
                    selectedMonth === null && styles.allTimeBtnTextActive,
                  ]}
                >
                  All Time
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
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
  badge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
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
  catTextWrap: {
    flex: 1,
  },
  rowLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  catCount: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
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
  emptyRow: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  headerCalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.textPrimary,
  },
  headerCalText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  filterModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  filterModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.floating,
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  filterModalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    marginTop: spacing.sm,
  },
  yearArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  yearArrowPlaceholder: {
    width: 34,
    height: 34,
  },
  yearText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.md,
  },
  monthCell: {
    width: '31%',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCellActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  monthCellCurrent: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  monthCellText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  monthCellTextCurrent: {
    color: colors.primary,
  },
  monthCellTextActive: {
    color: colors.surface,
  },
  footerActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footerActionBtn: {
    flex: 1,
  },
  allTimeBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allTimeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  allTimeBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  allTimeBtnTextActive: {
    color: colors.surface,
  },
});
