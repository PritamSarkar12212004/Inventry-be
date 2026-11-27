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
  Hash,
  IndianRupee,
  Layers,
  Receipt,
  TrendingUp,
  X,
} from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/types';
import { SkeletonBox } from '../../../core/components/SkeletonBox';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from '../../../core/theme';
import { useInfiniteExpenseCategories } from '../hooks';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

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

function getMonthRange(year: number, month: number) {
  const lastDay = new Date(year, month, 0).getDate();
  const mm = String(month).padStart(2, '0');
  return {
    startDate: `${year}-${mm}-01`,
    endDate: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
    label: `${MONTH_NAMES[month - 1] ?? ''} ${year}`,
  };
}

function fmtNum(val?: number): string {
  return Number(val || 0).toLocaleString('en-IN');
}

function fmtMoney(val?: number): string {
  return `₹${Number(val || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;
}

export function GeneralExpensesOverviewScreen() {
  const navigation = useNavigation<NavProp>();
  const now = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState<{
    year: number;
    month: number;
  } | null>(() => ({ year: now.getFullYear(), month: now.getMonth() + 1 }));
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
    useInfiniteExpenseCategories(
      undefined,
      monthRange?.startDate,
      monthRange?.endDate,
      50,
    );

  const overview = data?.pages?.[0]?.overview;
  const categories = useMemo(() => {
    const all = data?.pages.flatMap((p) => p.items) ?? [];
    return [...all].sort(
      (a, b) => Number(b.totalAmount || 0) - Number(a.totalAmount || 0),
    );
  }, [data]);

  const summaryRows = [
    {
      label: monthRange ? `${monthRange.label} Spend` : 'Total All-Time Spend',
      value: fmtMoney(overview?.totalExpenses),
      icon: <IndianRupee size={16} color={colors.primary} />,
      accent: colors.primary,
    },
    {
      label: 'Total Categories',
      value: fmtNum(overview?.totalCategories),
      icon: <Layers size={16} color={colors.primary} />,
    },
    {
      label: monthRange ? 'Entries This Month' : 'Total Entries',
      value: fmtNum(overview?.totalEntries),
      icon: <Hash size={16} color={colors.primary} />,
    },
    {
      label: 'Top Spend Category',
      value: overview?.topCategory
        ? `${overview.topCategory.name} (${fmtMoney(overview.topCategory.totalAmount)})`
        : '—',
      icon: <TrendingUp size={16} color={colors.success} />,
      accent: colors.success,
    },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      {isLoading && !overview ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <SkeletonBox width="100%" height={200} borderRadius={radius.lg} />
          <SkeletonBox
            width="100%"
            height={260}
            borderRadius={radius.lg}
            style={styles.mt12}
          />
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                void refetch();
              }}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              SUMMARY ({periodLabel.toUpperCase()})
            </Text>
            <View style={styles.card}>
              {summaryRows.map((row, idx) => (
                <React.Fragment key={row.label}>
                  {idx > 0 ? <View style={styles.divider} /> : null}
                  <View style={styles.row}>
                    <View style={styles.iconBox}>{row.icon}</View>
                    <Text style={styles.rowLabel}>{row.label}</Text>
                    <Text
                      style={[
                        styles.rowValue,
                        row.accent ? { color: row.accent } : undefined,
                      ]}
                      numberOfLines={1}
                    >
                      {row.value}
                    </Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              CATEGORY BREAKDOWN ({periodLabel.toUpperCase()})
            </Text>
            <View style={styles.card}>
              {categories.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>No categories found.</Text>
                </View>
              ) : (
                categories.map((cat, idx) => (
                  <React.Fragment key={cat._id}>
                    {idx > 0 ? <View style={styles.divider} /> : null}
                    <TouchableOpacity
                      style={styles.row}
                      activeOpacity={0.75}
                      onPress={() =>
                        navigation.navigate('CategoryExpenses', {
                          categoryCode: cat.code,
                          categoryName: cat.name,
                        })
                      }
                    >
                      <View style={styles.iconBox}>
                        <Receipt size={16} color={colors.primary} />
                      </View>
                      <View style={styles.catInfo}>
                        <Text style={styles.catName} numberOfLines={1}>
                          {cat.name}
                        </Text>
                        <Text style={styles.catMeta}>
                          {cat.titleCount ?? 0}{' '}
                          {(cat.titleCount ?? 0) === 1 ? 'item' : 'items'} •{' '}
                          {fmtNum(cat.expenseCount)}{' '}
                          {cat.expenseCount === 1 ? 'entry' : 'entries'}
                        </Text>
                      </View>
                      <Text style={styles.rowValue}>
                        {fmtMoney(cat.totalAmount)}
                      </Text>
                      <ChevronRight size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </React.Fragment>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Month & Year Picker Modal */}
      <Modal
        visible={filterModalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setFilterModalOpen(false)}
      >
        <View style={styles.filterModalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setFilterModalOpen(false)}
          />
          <View style={styles.filterModalCard}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Select Month</Text>
              <TouchableOpacity
                onPress={() => setFilterModalOpen(false)}
                hitSlop={8}
                style={styles.closeBtn}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.yearSwitchRow}>
              <TouchableOpacity
                style={styles.yearArrowBtn}
                onPress={() => setPickerYear((y) => y - 1)}
                activeOpacity={0.75}
              >
                <ChevronLeft size={18} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.yearText}>{pickerYear}</Text>
              {pickerYear < now.getFullYear() ? (
                <TouchableOpacity
                  style={styles.yearArrowBtn}
                  onPress={() => setPickerYear((y) => y + 1)}
                  activeOpacity={0.75}
                >
                  <ChevronRight size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              ) : (
                <View style={styles.yearArrowPlaceholder} />
              )}
            </View>

            <View style={styles.monthGrid}>
              {MONTH_NAMES.map((mName, idx) => {
                const monthNum = idx + 1;
                if (
                  pickerYear > now.getFullYear() ||
                  (pickerYear === now.getFullYear() &&
                    monthNum > now.getMonth() + 1)
                ) {
                  return null;
                }
                const isSelected =
                  selectedMonth?.year === pickerYear &&
                  selectedMonth?.month === monthNum;
                return (
                  <TouchableOpacity
                    key={mName}
                    style={[
                      styles.monthCell,
                      isSelected && styles.monthCellActive,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => {
                      setSelectedMonth({ year: pickerYear, month: monthNum });
                      setFilterModalOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.monthCellText,
                        isSelected && styles.monthCellTextActive,
                      ]}
                    >
                      {mName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[
                styles.allTimeBtn,
                selectedMonth === null && styles.allTimeBtnActive,
              ]}
              activeOpacity={0.75}
              onPress={() => {
                setSelectedMonth(null);
                setFilterModalOpen(false);
              }}
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
        </View>
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
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
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
  section: {
    gap: spacing.xs + 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 0.7,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    gap: spacing.sm + 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginLeft: spacing.md + 34 + spacing.sm + 2,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  rowValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    maxWidth: '48%',
    textAlign: 'right',
  },
  catInfo: {
    flex: 1,
    gap: 2,
  },
  catName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  catMeta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  emptyRow: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  mt12: {
    marginTop: 12,
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
  monthCellText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  monthCellTextActive: {
    color: colors.surface,
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
