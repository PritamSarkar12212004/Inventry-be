import React, { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowUpDown,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Search,
  ShoppingBag,
  X,
} from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/types';
import { IosLoader } from '../../../core/components/IosLoader';
import { useDebounce } from '../../../core/hooks/useDebounce';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from '../../../core/theme';
import { inventoryStyles } from '../../inventory/styles';
import { useFinancialOverview } from '../../financial/hooks';
import { SalesOverviewBanner } from '../components';
import { useInfiniteSalesOrders } from '../hooks';
import { SalesOrderListSkeleton } from '../skeletons';
import type { OrderSortBy, SalesOrderRecord } from '../types';

const ORDER_SORT_OPTIONS: Array<{ label: string; value: OrderSortBy }> = [
  { label: 'Newest First', value: 'DATE_DESC' },
  { label: 'Paid %: High → Low', value: 'PAID_DESC' },
  { label: 'Paid %: Low → High', value: 'PAID_ASC' },
  { label: 'Amount: High → Low', value: 'AMOUNT_DESC' },
  { label: 'Amount: Low → High', value: 'AMOUNT_ASC' },
  { label: 'Oldest First', value: 'DATE_ASC' },
];

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

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function SalesOrdersScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<OrderSortBy>('DATE_DESC');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(120);
  const sortBtnRef = useRef<React.ComponentRef<typeof View>>(null);
  const debouncedSearch = useDebounce(search.trim(), 350);

  const now = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState<{
    year: number;
    month: number | null;
  } | null>(() => ({ year: now.getFullYear(), month: null }));
  const [pickerYear, setPickerYear] = useState<number>(() =>
    now.getFullYear(),
  );
  const [dateModalOpen, setDateModalOpen] = useState(false);

  const monthRange = useMemo(
    () =>
      selectedMonth
        ? getMonthRange(selectedMonth.year, selectedMonth.month)
        : null,
    [selectedMonth],
  );
  const periodLabel = monthRange?.label ?? 'All Time';

  const handleOpenSortMenu = () => {
    sortBtnRef.current?.measureInWindow((_x, y, _w, height) => {
      setMenuTop(y + height + 6);
      setSortMenuOpen(true);
    });
  };

  const {
    data: overviewData,
    isLoading: overviewLoading,
    refetch: refetchOverview,
  } = useFinancialOverview(monthRange?.startDate, monthRange?.endDate);

  const {
    data,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteSalesOrders(
    debouncedSearch || undefined,
    undefined,
    sortBy,
    undefined,
    undefined,
    monthRange?.startDate,
    monthRange?.endDate,
  );

  const activeSortLabel =
    ORDER_SORT_OPTIONS.find((f) => f.value === sortBy)?.label || '';

  const orders = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderOrderCard = ({ item }: { item: SalesOrderRecord }) => {
    const hasGst = Boolean(item.includeGst && Number(item.tax || 0) > 0);
    const grandTotal = Number(item.grandTotal || 0);
    const paidAmount = Number(item.advancePaid || 0);
    const paidPercent =
      grandTotal > 0
        ? Math.min(100, Math.round((paidAmount / grandTotal) * 100))
        : 0;
    const paidLabel = `${paidPercent}% Paid`;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.82}
        onPress={() =>
          navigation.navigate('SalesOrderDetail', { orderId: item._id })
        }
      >
        <View style={styles.cardTopRow}>
          <View style={styles.orderNumWrap}>
            <FileText size={15} color={colors.primary} />
            <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          </View>
          <View style={styles.badgesRow}>
            <View style={[styles.gstBadge, styles.gstOff]}>
              <Text style={[styles.gstBadgeText, styles.gstOffText]}>
                {paidLabel}
              </Text>
            </View>
            <View style={[styles.gstBadge, styles.gstOff]}>
              <Text style={[styles.gstBadgeText, styles.gstOffText]}>
                {hasGst ? 'GST' : 'No GST'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.customerName} numberOfLines={1}>
          {item.customerSnapshot?.name || 'Walk-In Customer'}
        </Text>
        <Text style={styles.customerMeta} numberOfLines={1}>
          {item.customerSnapshot?.phone || 'No phone'} •{' '}
          {formatDate(item.orderDate)}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={styles.itemCount}>
            {item.items?.length ?? 0}{' '}
            {(item.items?.length ?? 0) === 1 ? 'item' : 'items'}
          </Text>
          <Text style={styles.grandTotal}>
            ₹{Number(item.grandTotal || 0).toLocaleString('en-IN')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={inventoryStyles.screen}>
      <View style={inventoryStyles.searchWrap}>
        <View style={inventoryStyles.searchRow}>
          <View style={inventoryStyles.searchBox}>
            <Search size={18} color={colors.textMuted} />
            <TextInput
              style={inventoryStyles.searchInput}
              placeholder="Search order #, customer name or phone..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <TouchableOpacity
            style={styles.datePickerBtn}
            onPress={() => {
              setPickerYear(selectedMonth?.year ?? now.getFullYear());
              setDateModalOpen(true);
            }}
            activeOpacity={0.8}
          >
            <Calendar size={16} color={colors.textPrimary} />
            <Text style={styles.datePickerText}>{periodLabel}</Text>
          </TouchableOpacity>

          <View ref={sortBtnRef} collapsable={false}>
            <TouchableOpacity
              style={[
                styles.filterBtn,
                sortBy !== 'DATE_DESC' && styles.filterBtnActive,
              ]}
              onPress={handleOpenSortMenu}
              activeOpacity={0.8}
            >
              <ArrowUpDown
                size={18}
                color={
                  sortBy !== 'DATE_DESC' ? colors.primary : colors.textSecondary
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {sortBy !== 'DATE_DESC' ? (
          <View style={inventoryStyles.filterChipRow}>
            <TouchableOpacity
              style={inventoryStyles.activeFilterChip}
              onPress={() => setSortBy('DATE_DESC')}
            >
              <Text style={inventoryStyles.activeFilterText}>
                Sort: {activeSortLabel}
              </Text>
              <X size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {isLoading ? (
        <SalesOrderListSkeleton />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          contentContainerStyle={inventoryStyles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
                refetchOverview();
              }}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            !debouncedSearch ? (
              <SalesOverviewBanner
                overview={overviewData}
                isLoading={overviewLoading}
                onPressOverview={() =>
                  navigation.navigate('SalesOverviewDetail')
                }
              />
            ) : undefined
          }
          renderItem={renderOrderCard}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={inventoryStyles.listFooterLoader}>
                <IosLoader size={20} color={colors.primary} />
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <View style={inventoryStyles.centerBox}>
              <ShoppingBag size={40} color={colors.textMuted} />
              <Text style={inventoryStyles.emptyTitle}>No sales orders yet</Text>
              <Text style={inventoryStyles.emptySubtitle}>
                Tap &quot;New Sale&quot; to create an order and share its PDF.
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={inventoryStyles.fab}
        onPress={() => navigation.navigate('SalesOrderForm')}
        activeOpacity={0.85}
      >
        <Plus size={18} color={colors.textInverse} />
        <Text style={inventoryStyles.fabText}>New Sale</Text>
      </TouchableOpacity>

      <Modal
        visible={sortMenuOpen}
        transparent
        animationType="none"
        onRequestClose={() => setSortMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.menuBackdrop}
          activeOpacity={1}
          onPress={() => setSortMenuOpen(false)}
        >
          <View style={[styles.menuCard, { top: menuTop }]}>
            {ORDER_SORT_OPTIONS.map((opt, idx) => {
              const selected = sortBy === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.filterOption,
                    idx === ORDER_SORT_OPTIONS.length - 1 &&
                      styles.filterOptionLast,
                    selected && styles.filterOptionActive,
                  ]}
                  onPress={() => {
                    setSortBy(opt.value);
                    setSortMenuOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      selected && styles.filterOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {selected ? (
                    <Check size={16} color={colors.primary} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Month & Year Picker Modal */}
      <Modal
        visible={dateModalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setDateModalOpen(false)}
      >
        <View style={styles.filterModalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDateModalOpen(false)}
          />
          <View style={styles.filterModalCard}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Select Month</Text>
              <TouchableOpacity
                onPress={() => setDateModalOpen(false)}
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
                      setDateModalOpen(false);
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
                  setDateModalOpen(false);
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
                  setDateModalOpen(false);
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
    </View>
  );
}

const styles = StyleSheet.create({
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuCard: {
    position: 'absolute',
    right: spacing.lg,
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  filterOptionLast: {
    borderBottomWidth: 0,
  },
  filterOptionActive: {
    backgroundColor: colors.primarySoft,
  },
  filterOptionText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  filterOptionTextActive: {
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderNumWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderNumber: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  gstBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  gstOn: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
  },
  gstOff: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
  },
  gstBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  gstOnText: {
    color: colors.success,
  },
  gstOffText: {
    color: colors.textSecondary,
  },
  customerName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  customerMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  itemCount: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  grandTotal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 44,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.textPrimary,
  },
  datePickerText: {
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
