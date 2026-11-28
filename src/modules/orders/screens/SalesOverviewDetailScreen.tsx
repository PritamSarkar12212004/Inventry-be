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
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Wallet,
  X,
  XCircle,
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
import { useFinancialOverview } from '../../financial/hooks';

function fmtNum(val?: number): string {
  return Number(val || 0).toLocaleString('en-IN');
}

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

type OverviewSection = {
  title: string;
  rows: OverviewListRow[];
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

export function SalesOverviewDetailScreen() {
  const navigation = useNavigation();
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

  const { data: overview, isLoading, isRefetching, refetch } =
    useFinancialOverview(monthRange?.startDate, monthRange?.endDate);

  const handleOpenReceive = () => {
    const navAny = navigation as unknown as {
      navigate: (name: string, params?: Record<string, unknown>) => void;
    };
    navAny.navigate('Main', { screen: 'ReceiveTab' });
  };

  if (isLoading && !overview) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <SkeletonBox width="100%" height={86} borderRadius={radius.lg} />
          <SkeletonBox
            width="100%"
            height={180}
            borderRadius={radius.lg}
            style={styles.mt12}
          />
          <SkeletonBox
            width="100%"
            height={220}
            borderRadius={radius.lg}
            style={styles.mt12}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const totalSales = Math.max(overview?.totalSales || 0, 0);
  const totalReceived = Math.max(overview?.totalReceived || 0, 0);
  const collectedPct =
    totalSales > 0
      ? Math.min(100, Math.round((totalReceived / totalSales) * 100))
      : 0;

  const sections: OverviewSection[] = [
    {
      title: 'SALES & COLLECTION',
      rows: [
        {
          label: 'Total Sales',
          value: fmtMoney(overview?.totalSales),
          icon: <TrendingUp size={17} color={colors.primary} />,
          accent: colors.primary,
        },
        {
          label: 'Total Received',
          value: fmtMoney(overview?.totalReceived),
          icon: <IndianRupee size={17} color={colors.success} />,
          accent: colors.success,
        },
        {
          label: 'Pending Due',
          value: fmtMoney(overview?.totalPendingDue),
          icon: <Wallet size={17} color={colors.warning} />,
          accent: colors.warning,
          onPress: handleOpenReceive,
        },
      ],
    },
    {
      title: 'ORDERS BREAKDOWN',
      rows: [
        {
          label: 'Total Orders',
          value: fmtNum(overview?.totalOrders),
          icon: <ShoppingBag size={17} color={colors.textPrimary} />,
        },
        {
          label: 'Paid Orders',
          value: fmtNum(overview?.paidOrdersCount),
          icon: <CheckCircle2 size={17} color={colors.success} />,
          accent: colors.success,
        },
        {
          label: 'Partial Paid Orders',
          value: fmtNum(overview?.partialOrdersCount),
          icon: <Clock size={17} color={colors.warning} />,
          accent: colors.warning,
        },
        {
          label: 'Unpaid Orders',
          value: fmtNum(overview?.unpaidOrdersCount),
          icon: <XCircle size={17} color={colors.danger} />,
          accent: colors.danger,
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
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.healthBanner}>
          <View style={styles.healthTopRow}>
            <View>
              <Text style={styles.eyebrow}>SALES OVERVIEW</Text>
              <Text style={styles.bannerTitle}>Collection Progress</Text>
            </View>
            <View style={styles.healthBadge}>
              <Text style={styles.healthText}>{collectedPct}% Collected</Text>
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
                const isCurrentMonth =
                  pickerYear === now.getFullYear() &&
                  monthNum === now.getMonth() + 1;
                return (
                  <TouchableOpacity
                    key={mName}
                    style={[
                      styles.monthCell,
                      isCurrentMonth && !isSelected && styles.monthCellCurrent,
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
                        isCurrentMonth &&
                          !isSelected &&
                          styles.monthCellTextCurrent,
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
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedMonth({ year: pickerYear, month: null });
                  setFilterModalOpen(false);
                }}
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
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  healthText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
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
