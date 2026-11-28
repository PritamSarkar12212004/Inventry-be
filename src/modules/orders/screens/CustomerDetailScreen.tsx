import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpDown,
  Bell,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  MapPin,
  Phone,
  Search,
  ShoppingBag,
  X,
} from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/types';
import { IosLoader } from '../../../core/components/IosLoader';
import { useDebounce } from '../../../core/hooks/useDebounce';
import { popup } from '../../../core/store/popupStore';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from '../../../core/theme';
import { inventoryStyles } from '../../inventory/styles';
import type { AxiosError } from 'axios';
import { ordersApi } from '../api';
import {
  useCustomerDetail,
  useInfiniteSalesOrders,
  useSendCustomerPaymentReminder,
} from '../hooks';
import { SalesOrderListSkeleton } from '../skeletons';
import type { OrderSortBy, SalesOrderRecord } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerDetail'>;

const ORDER_SORT_OPTIONS: Array<{ label: string; value: OrderSortBy }> = [
  { label: 'Newest First', value: 'DATE_DESC' },
  { label: 'Paid %: High → Low', value: 'PAID_DESC' },
  { label: 'Paid %: Low → High', value: 'PAID_ASC' },
  { label: 'Amount: High → Low', value: 'AMOUNT_DESC' },
  { label: 'Amount: Low → High', value: 'AMOUNT_ASC' },
  { label: 'Oldest First', value: 'DATE_ASC' },
];

type ListRow =
  | { kind: 'PROFILE'; key: string }
  | { kind: 'SEARCH'; key: string }
  | { kind: 'SECTION'; key: string }
  | { kind: 'EMPTY'; key: string }
  | { kind: 'ORDER'; key: string; order: SalesOrderRecord };

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

function fmtMoney(val?: number): string {
  return `₹${Math.round(Number(val || 0)).toLocaleString('en-IN')}`;
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'C';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
}

export function CustomerDetailScreen({ route, navigation }: Props) {
  const { customer: routeCustomer } = route.params;
  const { data: liveCustomer } = useCustomerDetail(
    routeCustomer._id,
    routeCustomer,
  );
  const customer = liveCustomer ?? routeCustomer;
  const { mutate: sendReminder, isPending: isSendingReminder } =
    useSendCustomerPaymentReminder();
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
    customer._id,
    undefined,
    monthRange?.startDate,
    monthRange?.endDate,
  );

  const {
    data: yearOrdersData,
    isLoading: yearOrdersLoading,
  } = useQuery({
    queryKey: ['orders', 'customer-year-balance', customer._id, pickerYear],
    queryFn: async () => {
      const res = await ordersApi.getSalesOrders({
        customerId: customer._id,
        pendingOnly: true,
        startDate: `${pickerYear}-01-01`,
        endDate: `${pickerYear}-12-31`,
        limit: 100,
      });
      return res.data.items ?? [];
    },
    enabled: Boolean(customer._id),
    staleTime: 60_000,
    retry: 1,
  });

  const { monthlyBalanceMap, yearTotalDue } = useMemo(() => {
    const map: Record<number, { due: number; count: number }> = {};
    let totalDue = 0;
    for (const o of yearOrdersData ?? []) {
      if (o.fulfillmentStatus === 'CANCELLED') continue;
      const dt = new Date(o.orderDate || '');
      if (Number.isNaN(dt.getTime())) continue;
      const m = dt.getMonth() + 1;
      const due = Math.max(
        0,
        Number(o.grandTotal || 0) - Number(o.advancePaid || 0),
      );
      if (!map[m]) map[m] = { due: 0, count: 0 };
      map[m]!.due += due;
      map[m]!.count += 1;
      totalDue += due;
    }
    return { monthlyBalanceMap: map, yearTotalDue: totalDue };
  }, [yearOrdersData]);

  const activeSortLabel =
    ORDER_SORT_OPTIONS.find((f) => f.value === sortBy)?.label || '';

  const orders = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const monthTotals = useMemo(() => {
    let spent = 0;
    let paid = 0;
    for (const o of orders) {
      if (o.fulfillmentStatus === 'CANCELLED') continue;
      spent += Number(o.grandTotal || 0);
      paid += Number(o.advancePaid || 0);
    }
    return {
      spent,
      due: Math.max(0, spent - paid),
      count: data?.pages?.[0]?.pagination?.total ?? orders.length,
    };
  }, [orders, data]);

  const totalSpent = selectedMonth
    ? monthTotals.spent
    : Number(customer.totalSpent || 0);
  const totalPaid = Number(customer.totalPaid || 0);
  const totalDue = selectedMonth
    ? monthTotals.due
    : Math.max(0, totalSpent - totalPaid);
  const hasPendingOrders = useMemo(
    () =>
      totalDue > 0 ||
      orders.some(
        (o) =>
          o.fulfillmentStatus !== 'CANCELLED' &&
          Number(o.grandTotal || 0) - Number(o.advancePaid || 0) > 0,
      ),
    [totalDue, orders],
  );

  const handleAlertPress = useCallback(() => {
    if (isSendingReminder) return;
    sendReminder(customer._id, {
      onSuccess: (res) => {
        popup.success(
          'Reminder Sent',
          res.message || 'Payment reminder sent to customer on WhatsApp.',
        );
      },
      onError: (err) => {
        const axiosErr = err as AxiosError<{ message?: string }>;
        popup.error(
          'Reminder Failed',
          axiosErr.response?.data?.message ||
            'Unable to send payment reminder.',
        );
      },
    });
  }, [customer._id, isSendingReminder, sendReminder]);

  const renderHeaderRight = useCallback(
    () => (
      <View style={styles.headerRightRow}>
        <TouchableOpacity
          style={styles.headerCalBtn}
          activeOpacity={0.75}
          onPress={() => {
            setPickerYear(selectedMonth?.year ?? now.getFullYear());
            setDateModalOpen(true);
          }}
        >
          <Calendar size={16} color={colors.primary} />
          <Text style={styles.headerCalText}>{periodLabel}</Text>
        </TouchableOpacity>
        {hasPendingOrders ? (
          <TouchableOpacity
            style={styles.headerAlertBtn}
            onPress={handleAlertPress}
            activeOpacity={0.75}
            disabled={isSendingReminder}
          >
            {isSendingReminder ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Bell size={19} color={colors.primary} />
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    ),
    [
      handleAlertPress,
      hasPendingOrders,
      isSendingReminder,
      now,
      periodLabel,
      selectedMonth,
    ],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: renderHeaderRight,
    });
  }, [navigation, renderHeaderRight]);

  const listRows = useMemo<ListRow[]>(() => {
    const rows: ListRow[] = [
      { kind: 'PROFILE', key: '__profile__' },
      { kind: 'SEARCH', key: '__search__' },
      { kind: 'SECTION', key: '__section__' },
    ];
    if (orders.length === 0) {
      rows.push({ kind: 'EMPTY', key: '__empty__' });
    } else {
      for (const order of orders) {
        rows.push({ kind: 'ORDER', key: order._id, order });
      }
    }
    return rows;
  }, [orders]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const totalOrders = selectedMonth
    ? monthTotals.count
    : Number(customer.totalOrders ?? orders.length);
  const resolvedAddress =
    customer.billingAddress || customer.shippingAddress || customer.address;

  const handleCall = () => {
    if (!customer.phone) return;
    Linking.openURL(`tel:${customer.phone}`).catch(() => {});
  };

  const renderRow = ({ item }: { item: ListRow }) => {
    if (item.kind === 'PROFILE') {
      return (
        <View style={styles.profileHeader}>
          <View style={styles.customerTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(customer.name)}</Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{customer.name}</Text>
              {customer.phone ? (
                <TouchableOpacity
                  style={styles.infoRow}
                  onPress={handleCall}
                  activeOpacity={0.75}
                >
                  <Phone size={12} color={colors.primary} />
                  <Text style={styles.phoneText}>{customer.phone}</Text>
                </TouchableOpacity>
              ) : null}
              {resolvedAddress ? (
                <View style={styles.infoRow}>
                  <MapPin size={12} color={colors.textMuted} />
                  <Text style={styles.addressText}>{resolvedAddress}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Orders</Text>
              <Text style={styles.kpiVal}>{totalOrders}</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiBoxCenter}>
              <Text style={styles.kpiLabel}>Total Amount</Text>
              <Text style={styles.kpiVal}>
                ₹{totalSpent.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiBoxRight}>
              <Text style={styles.kpiLabel}>Balance</Text>
              <Text style={styles.kpiVal}>
                ₹{totalDue.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    if (item.kind === 'SEARCH') {
      return (
        <View style={styles.stickySearchWrap}>
          <View style={inventoryStyles.searchRow}>
            <View style={styles.searchBox}>
              <Search size={18} color={colors.textMuted} />
              <TextInput
                style={inventoryStyles.searchInput}
                placeholder="Search order #..."
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <View ref={sortBtnRef} collapsable={false}>
              <TouchableOpacity
                style={[
                  styles.sortBtn,
                  sortBy !== 'DATE_DESC' && styles.sortBtnActive,
                ]}
                onPress={handleOpenSortMenu}
                activeOpacity={0.8}
              >
                <ArrowUpDown
                  size={18}
                  color={
                    sortBy !== 'DATE_DESC'
                      ? colors.primary
                      : colors.textSecondary
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
      );
    }

    if (item.kind === 'SECTION') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Invoices & Orders</Text>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{orders.length}</Text>
          </View>
        </View>
      );
    }

    if (item.kind === 'EMPTY') {
      return isLoading ? (
        <SalesOrderListSkeleton embedded count={4} />
      ) : (
        <View style={styles.emptyBox}>
          <ShoppingBag size={36} color={colors.textMuted} />
          <Text style={inventoryStyles.emptyTitle}>No orders found</Text>
          <Text style={inventoryStyles.emptySubtitle}>
            Orders for this customer will appear here.
          </Text>
        </View>
      );
    }

    const order = item.order;
    const hasGst = Boolean(order.includeGst && Number(order.tax || 0) > 0);
    const grandTotal = Number(order.grandTotal || 0);
    const paidAmount = Number(order.advancePaid || 0);
    const dueAmount = Math.max(0, grandTotal - paidAmount);
    const isCancelled = order.fulfillmentStatus === 'CANCELLED';
    const paidPercent =
      grandTotal > 0
        ? Math.min(100, Math.round((paidAmount / grandTotal) * 100))
        : 0;

    const statusBadge = isCancelled
      ? {
          label: 'Cancelled',
          bg: colors.surfacePressed,
          border: colors.border,
          text: colors.textMuted,
          dot: colors.textMuted,
          accent: colors.border,
        }
      : paidPercent >= 100
        ? {
            label: 'Paid',
            bg: colors.successBg,
            border: colors.successBorder,
            text: colors.success,
            dot: colors.success,
            accent: colors.success,
          }
        : paidPercent > 0
          ? {
              label: `${paidPercent}% Paid`,
              bg: colors.warningBg,
              border: colors.warningBorder,
              text: colors.warning,
              dot: colors.warning,
              accent: colors.warning,
            }
          : {
              label: 'Unpaid',
              bg: colors.dangerBg,
              border: colors.dangerBorder,
              text: colors.danger,
              dot: colors.danger,
              accent: colors.danger,
            };

    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.82}
        onPress={() =>
          navigation.navigate('SalesOrderDetail', { orderId: order._id })
        }
      >
        <View
          style={[
            styles.orderAccentBar,
            { backgroundColor: statusBadge.accent },
          ]}
        />
        <View style={styles.orderCardInner}>
          <View style={styles.cardTopRow}>
            <View style={styles.orderNumWrap}>
              <FileText size={14} color={colors.primary} />
              <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            </View>
            <View style={styles.badgesRow}>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: statusBadge.bg,
                    borderColor: statusBadge.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: statusBadge.dot },
                  ]}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: statusBadge.text },
                  ]}
                >
                  {statusBadge.label}
                </Text>
              </View>
              <View
                style={[
                  styles.neutralBadge,
                  hasGst && styles.gstActiveBadge,
                ]}
              >
                <Text
                  style={[
                    styles.neutralBadgeText,
                    hasGst && styles.gstActiveBadgeText,
                  ]}
                >
                  {hasGst ? 'GST' : 'No GST'}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.dateMeta}>{formatDate(order.orderDate)}</Text>

          <View style={styles.bottomRow}>
            <View style={styles.bottomLeftRow}>
              <Text style={styles.itemCount}>
                {order.items?.length ?? 0}{' '}
                {(order.items?.length ?? 0) === 1 ? 'item' : 'items'}
              </Text>
              {!isCancelled && dueAmount > 0 ? (
                <Text style={styles.dueTag}>
                  Due ₹{Math.round(dueAmount).toLocaleString('en-IN')}
                </Text>
              ) : null}
            </View>
            <View style={styles.amountRight}>
              <Text style={styles.grandTotal}>
                ₹{Math.round(grandTotal).toLocaleString('en-IN')}
              </Text>
              <ChevronRight size={16} color={colors.textMuted} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={inventoryStyles.screen}>
      <FlatList
        data={listRows}
        keyExtractor={(item) => item.key}
        stickyHeaderIndices={[1]}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
            }}
            tintColor={colors.primary}
          />
        }
        renderItem={renderRow}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={inventoryStyles.listFooterLoader}>
              <IosLoader size={20} color={colors.primary} />
            </View>
          ) : undefined
        }
      />

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
                    styles.sortOption,
                    idx === ORDER_SORT_OPTIONS.length - 1 &&
                      styles.sortOptionLast,
                    selected && styles.sortOptionActive,
                  ]}
                  onPress={() => {
                    setSortBy(opt.value);
                    setSortMenuOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      selected && styles.sortOptionTextActive,
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
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalHeaderIcon}>
                  <Calendar size={17} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.filterModalTitle}>Select Period</Text>
                  <Text style={styles.filterModalSub}>
                    Monthly balance due overview
                  </Text>
                </View>
              </View>
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
              <View style={styles.yearCenterWrap}>
                <Text style={styles.yearText}>{pickerYear}</Text>
                <Text
                  style={[
                    styles.yearDueSub,
                    yearTotalDue <= 0 && styles.yearDueSubClear,
                  ]}
                  numberOfLines={1}
                >
                  {yearOrdersLoading
                    ? 'Loading...'
                    : yearTotalDue > 0
                      ? `Due ${fmtMoney(yearTotalDue)}`
                      : 'No Due'}
                </Text>
              </View>
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
                const mStats = monthlyBalanceMap[monthNum];
                const mDue = Math.round(mStats?.due ?? 0);
                const mCount = mStats?.count ?? 0;
                const hasDue = mDue > 0;
                return (
                  <TouchableOpacity
                    key={mName}
                    style={[
                      styles.monthCell,
                      hasDue && !isSelected && styles.monthCellHasDue,
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
                    <Text
                      style={[
                        styles.monthBalanceText,
                        hasDue && styles.monthBalanceDue,
                        !hasDue && mCount > 0 && styles.monthBalancePaid,
                        isSelected && styles.monthBalanceActive,
                      ]}
                      numberOfLines={1}
                    >
                      {yearOrdersLoading ? '...' : fmtMoney(mDue)}
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
  listContent: {
    paddingBottom: 96,
  },
  profileHeader: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  customerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  phoneText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  addressText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  kpiBox: {
    flex: 1,
  },
  kpiBoxCenter: {
    flex: 1.3,
    alignItems: 'center',
  },
  kpiBoxRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  kpiDivider: {
    width: 1,
    height: 26,
    backgroundColor: colors.borderSubtle,
  },
  kpiLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  kpiVal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  stickySearchWrap: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  sortBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortBtnActive: {
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
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  sortOptionLast: {
    borderBottomWidth: 0,
  },
  sortOptionActive: {
    backgroundColor: colors.primarySoft,
  },
  sortOptionText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  sortOptionTextActive: {
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  countPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countPillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  orderCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadows.card,
  },
  orderAccentBar: {
    width: 3.5,
  },
  orderCardInner: {
    flex: 1,
    padding: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  gstActiveBadge: {
    backgroundColor: colors.primarySoft,
    borderColor: '#BFDBFE',
  },
  gstActiveBadgeText: {
    color: colors.primary,
  },
  bottomLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dueTag: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    overflow: 'hidden',
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
  orderNumber: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  neutralBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
  },
  neutralBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  dateMeta: {
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
  amountRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  grandTotal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  headerAlertBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerCalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  headerCalText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  filterModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  filterModalCard: {
    width: '96%',
    maxWidth: 420,
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
    marginBottom: spacing.sm,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  modalHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModalTitle: {
    fontSize: fontSize.md + 1,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  filterModalSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
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
  yearCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
  },
  yearText: {
    fontSize: fontSize.md + 1,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  yearDueSub: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.danger,
    lineHeight: 15,
    marginTop: 1,
  },
  yearDueSubClear: {
    color: colors.success,
    fontWeight: fontWeight.semibold,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: spacing.md,
  },
  monthCell: {
    width: '31%',
    minHeight: 64,
    paddingVertical: spacing.sm + 3,
    paddingHorizontal: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  monthCellHasDue: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerBg,
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
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  monthCellTextCurrent: {
    color: colors.primary,
  },
  monthCellTextActive: {
    color: colors.surface,
  },
  monthBalanceText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },
  monthBalanceDue: {
    color: colors.danger,
    fontWeight: fontWeight.bold,
  },
  monthBalancePaid: {
    color: colors.success,
  },
  monthBalanceActive: {
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
