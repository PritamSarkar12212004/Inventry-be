import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ArrowUpDown,
  Bell,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  FileText,
  MapPin,
  Phone,
  Search,
  X,
} from 'lucide-react-native';
import type { AxiosError } from 'axios';
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
import {
  useInfiniteSalesOrders,
  useSendCustomerPaymentReminder,
} from '../../orders/hooks';
import type { OrderSortBy, SalesOrderRecord } from '../../orders/types';
import {
  MonthYearPickerModal,
  getMonthRange,
  type SelectedMonth,
} from '../components';
import { useCustomerOutstanding } from '../hooks';
import { PendingInvoicesSkeleton } from '../skeletons';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerPendingDetail'>;

const ORDER_SORT_OPTIONS: Array<{ label: string; value: OrderSortBy }> = [
  { label: 'Newest First', value: 'DATE_DESC' },
  { label: 'Amount: High → Low', value: 'AMOUNT_DESC' },
  { label: 'Amount: Low → High', value: 'AMOUNT_ASC' },
  { label: 'Paid %: Low → High', value: 'PAID_ASC' },
  { label: 'Paid %: High → Low', value: 'PAID_DESC' },
  { label: 'Oldest First', value: 'DATE_ASC' },
];

type ListRow =
  | { kind: 'HEADER'; key: string }
  | { kind: 'SEARCH'; key: string }
  | { kind: 'SECTION'; key: string }
  | { kind: 'EMPTY'; key: string }
  | { kind: 'ORDER'; key: string; order: SalesOrderRecord };

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

export function CustomerPendingDetailScreen({ route, navigation }: Props) {
  const { customer: routeCustomer } = route.params;
  const [selectedMonth, setSelectedMonth] = useState<SelectedMonth>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const monthRange = useMemo(
    () =>
      selectedMonth
        ? getMonthRange(
            selectedMonth.year,
            selectedMonth.month,
            selectedMonth.preset,
          )
        : null,
    [selectedMonth],
  );
  const periodLabel = monthRange?.label ?? 'All Time';

  const { data: outstandingData, refetch: refetchOutstanding } =
    useCustomerOutstanding(
      undefined,
      monthRange?.startDate,
      monthRange?.endDate,
    );

  const customer = useMemo(() => {
    if (!outstandingData) return routeCustomer;
    const match = outstandingData.customers.find((c) =>
      routeCustomer.customerId
        ? c.customerId === routeCustomer.customerId
        : c.customerName === routeCustomer.customerName &&
          c.phone === routeCustomer.phone,
    );
    if (match) return match;
    return {
      ...routeCustomer,
      pendingOrdersCount: 0,
      totalBilled: selectedMonth ? 0 : routeCustomer.totalBilled,
      totalPaid: selectedMonth ? 0 : routeCustomer.totalBilled,
      outstanding: 0,
      ageingDays: 0,
    };
  }, [outstandingData, routeCustomer, selectedMonth]);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<OrderSortBy>('DATE_DESC');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(120);
  const sortBtnRef = useRef<React.ComponentRef<typeof View>>(null);
  const debouncedSearch = useDebounce(search.trim(), 300);
  const { mutate: sendReminder, isPending: isSendingReminder } =
    useSendCustomerPaymentReminder();

  const effectiveSearch = customer.customerId
    ? debouncedSearch
    : debouncedSearch || customer.phone || customer.customerName;

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteSalesOrders(
    effectiveSearch || undefined,
    undefined,
    sortBy,
    customer.customerId || undefined,
    true,
    monthRange?.startDate,
    monthRange?.endDate,
  );

  const orders = useMemo(() => {
    const raw = data?.pages.flatMap((p) => p.items) ?? [];
    return raw.filter((o) => o.fulfillmentStatus !== 'CANCELLED');
  }, [data]);

  const hasPending =
    Number(customer.outstanding || 0) > 0 || orders.length > 0;

  const handleAlertPress = useCallback(() => {
    if (isSendingReminder) return;
    if (!customer.customerId) {
      popup.error(
        'Cannot Send Reminder',
        'Customer profile is not linked to this pending account.',
      );
      return;
    }

    sendReminder(customer.customerId, {
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
  }, [customer.customerId, isSendingReminder, sendReminder]);

  const renderHeaderRight = useCallback(
    () => (
      <View style={styles.headerRightRow}>
        <TouchableOpacity
          style={styles.headerCalBtn}
          activeOpacity={0.75}
          onPress={() => setFilterModalOpen(true)}
        >
          <Calendar size={15} color={colors.primary} />
          <Text style={styles.headerCalText}>{periodLabel}</Text>
        </TouchableOpacity>
        {hasPending ? (
          <TouchableOpacity
            style={styles.headerAlertBtn}
            onPress={handleAlertPress}
            activeOpacity={0.75}
            disabled={isSendingReminder}
          >
            {isSendingReminder ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Bell size={17} color={colors.primary} />
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    ),
    [handleAlertPress, hasPending, isSendingReminder, periodLabel],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: renderHeaderRight,
    });
  }, [navigation, renderHeaderRight]);

  const activeSortLabel =
    ORDER_SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label ??
    'Newest First';

  const overallPaidPct =
    customer.totalBilled > 0
      ? Math.min(
          100,
          Math.round((customer.totalPaid / customer.totalBilled) * 100),
        )
      : 0;

  const listRows = useMemo<ListRow[]>(() => {
    const rows: ListRow[] = [
      { kind: 'HEADER', key: 'header' },
      { kind: 'SEARCH', key: 'search' },
      { kind: 'SECTION', key: 'section' },
    ];
    if (orders.length === 0) {
      rows.push({ kind: 'EMPTY', key: 'empty' });
    } else {
      orders.forEach((order) => {
        rows.push({ kind: 'ORDER', key: order._id, order });
      });
    }
    return rows;
  }, [orders]);

  const handleOpenSortMenu = () => {
    sortBtnRef.current?.measureInWindow((_x, y, _w, height) => {
      setMenuTop(y + height + 6);
      setSortMenuOpen(true);
    });
  };

  const renderRow = ({ item }: { item: ListRow }) => {
    if (item.kind === 'HEADER') {
      const isSettled =
        customer.outstanding <= 0 && customer.pendingOrdersCount === 0;
      const isOverdue = !isSettled && customer.ageingDays >= 30;
      return (
        <View style={styles.heroWrap}>
          <View style={styles.profileCard}>
            {/* Customer Identity Row */}
            <View style={styles.profileTop}>
              <View style={styles.avatarLg}>
                <Text style={styles.avatarLgText}>
                  {getInitials(customer.customerName)}
                </Text>
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.customerName} numberOfLines={1}>
                  {customer.customerName}
                </Text>

                <View style={styles.metaRow}>
                  {customer.phone ? (
                    <TouchableOpacity
                      style={styles.phoneChip}
                      onPress={() => Linking.openURL(`tel:${customer.phone}`)}
                      activeOpacity={0.75}
                    >
                      <Phone size={12} color={colors.primary} />
                      <Text style={styles.phoneChipText}>{customer.phone}</Text>
                    </TouchableOpacity>
                  ) : null}

                  <View
                    style={[
                      styles.agePill,
                      isSettled
                        ? styles.agePillSettled
                        : isOverdue
                          ? styles.agePillDanger
                          : styles.agePillWarning,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: isSettled
                            ? colors.success
                            : isOverdue
                              ? colors.danger
                              : colors.warning,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.agePillText,
                        isSettled
                          ? styles.ageTextSettled
                          : isOverdue
                            ? styles.ageTextDanger
                            : styles.ageTextWarning,
                      ]}
                    >
                      {isSettled
                        ? 'Settled'
                        : customer.ageingDays === 0
                          ? 'Due Today'
                          : `${customer.ageingDays}d Pending`}
                    </Text>
                  </View>
                </View>

                {customer.billingAddress ? (
                  <View style={styles.addressRow}>
                    <MapPin size={12} color={colors.textMuted} />
                    <Text style={styles.addressText} numberOfLines={1}>
                      {customer.billingAddress}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Primary Balance Highlight */}
            <View style={styles.balanceBanner}>
              <View>
                <Text style={styles.balanceEyebrow}>TOTAL BALANCE DUE</Text>
                <Text
                  style={[
                    styles.balanceHeroAmt,
                    isSettled ? styles.greenText : styles.dangerText,
                  ]}
                  numberOfLines={1}
                >
                  {fmtMoney(customer.outstanding)}
                </Text>
              </View>
              <View style={styles.pendingCountPill}>
                <Clock size={12} color={colors.primary} />
                <Text style={styles.pendingCountText}>
                  {customer.pendingOrdersCount}{' '}
                  {customer.pendingOrdersCount === 1 ? 'Invoice' : 'Invoices'}
                </Text>
              </View>
            </View>

            {/* Collection Progress */}
            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>Collection Progress</Text>
                <Text style={styles.progressPct}>{overallPaidPct}% Paid</Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${overallPaidPct}%` }]}
                />
              </View>
            </View>

            {/* Spacious 2-Column Billed vs Paid */}
            <View style={styles.twoColStrip}>
              <View style={styles.twoColCell}>
                <Text style={styles.twoColLabel}>Total Billed</Text>
                <Text style={styles.twoColVal} numberOfLines={1}>
                  {fmtMoney(customer.totalBilled)}
                </Text>
              </View>
              <View style={styles.twoColDivider} />
              <View style={styles.twoColCell}>
                <Text style={styles.twoColLabel}>Total Paid</Text>
                <Text
                  style={[styles.twoColVal, styles.greenText]}
                  numberOfLines={1}
                >
                  {fmtMoney(customer.totalPaid)}
                </Text>
              </View>
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
              <Search size={17} color={colors.textMuted} />
              <TextInput
                style={inventoryStyles.searchInput}
                placeholder="Search pending invoice #..."
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 ? (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                  <X size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
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
                  size={17}
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
          <Text style={styles.sectionTitle}>PENDING INVOICES</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionCount}>
              {orders.length} {orders.length === 1 ? 'invoice' : 'invoices'}
            </Text>
          </View>
        </View>
      );
    }

    if (item.kind === 'EMPTY') {
      return isLoading ? (
        <PendingInvoicesSkeleton />
      ) : (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconBox}>
            <FileText size={26} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No pending invoices</Text>
          <Text style={styles.emptySub}>
            {debouncedSearch
              ? 'Try clearing your search filter.'
              : `No unpaid invoices for ${periodLabel}.`}
          </Text>
        </View>
      );
    }

    const order = item.order;
    const grandTotal = Number(order.grandTotal || 0);
    const paid = Number(order.advancePaid || 0);
    const due = Math.max(0, grandTotal - paid);
    const paidPct =
      grandTotal > 0 ? Math.min(100, Math.round((paid / grandTotal) * 100)) : 0;
    const isUnpaid = order.paymentStatus === 'UNPAID' || paidPct === 0;
    const hasGst = order.includeGst !== false && Number(order.tax || 0) > 0;
    const visibleItems = order.items.slice(0, 2);
    const extraCount = Math.max(0, order.items.length - 2);

    return (
      <TouchableOpacity
        style={styles.invoiceCard}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('SalesOrderDetail', { orderId: order._id })
        }
      >
        <View
          style={[
            styles.invoiceAccentBar,
            { backgroundColor: isUnpaid ? colors.danger : colors.warning },
          ]}
        />
        <View style={styles.invoiceInner}>
          {/* Row 1: Order Number + Date (Never Collides) */}
          <View style={styles.invoiceTopRow}>
            <View style={styles.invoiceNumRow}>
              <FileText size={14} color={colors.primary} />
              <Text style={styles.invoiceNum}>{order.orderNumber}</Text>
            </View>
            <Text style={styles.dateText}>{formatDate(order.orderDate)}</Text>
          </View>

          {/* Row 2: Distinct Semantic Status Badges */}
          <View style={styles.badgesRow}>
            <View
              style={[
                styles.statusBadge,
                isUnpaid ? styles.unpaidBadge : styles.partialBadge,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isUnpaid ? colors.danger : colors.warning,
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  isUnpaid ? styles.unpaidText : styles.partialText,
                ]}
              >
                {isUnpaid ? 'Unpaid' : `${paidPct}% Paid`}
              </Text>
            </View>

            <View style={[styles.gstBadge, hasGst && styles.gstBadgeActive]}>
              <Text
                style={[styles.gstText, hasGst && styles.gstTextActive]}
              >
                {hasGst ? 'GST' : 'No GST'}
              </Text>
            </View>
          </View>

          {/* Row 3: Clean Items Preview */}
          {visibleItems.length > 0 ? (
            <View style={styles.itemsPreview}>
              {visibleItems.map((line, idx) => (
                <View key={`${order._id}-item-${idx}`} style={styles.itemLine}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {line.productName} × {line.orderedQuantity}{' '}
                    {line.unit || ''}
                  </Text>
                  <Text style={styles.itemAmt}>{fmtMoney(line.lineTotal)}</Text>
                </View>
              ))}
              {extraCount > 0 ? (
                <Text style={styles.moreItemsText}>
                  +{extraCount} more {extraCount === 1 ? 'item' : 'items'}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* Row 4: Clean Footer — Total/Paid left, Prominent Due right */}
          <View style={styles.invoiceFooter}>
            <View style={styles.footerMetaCol}>
              <Text style={styles.footerMetaLine}>
                Total <Text style={styles.footerMetaBold}>{fmtMoney(grandTotal)}</Text>
              </Text>
              <Text style={styles.footerMetaLine}>
                Paid <Text style={styles.footerMetaPaid}>{fmtMoney(paid)}</Text>
              </Text>
            </View>

            <View style={styles.dueRightBox}>
              <Text style={styles.dueCaption}>Balance Due</Text>
              <View style={styles.dueValueRow}>
                <Text style={styles.dueBigAmt}>{fmtMoney(due)}</Text>
                <ChevronRight size={16} color={colors.primary} />
              </View>
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
        renderItem={renderRow}
        stickyHeaderIndices={[1]}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <IosLoader size={22} color={colors.primary} />
            </View>
          ) : undefined
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
              refetchOutstanding();
            }}
            tintColor={colors.primary}
          />
        }
      />

      <Modal
        visible={sortMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSortMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setSortMenuOpen(false)}
        >
          <View style={[styles.sortMenu, { top: menuTop }]}>
            {ORDER_SORT_OPTIONS.map((opt) => {
              const selected = opt.value === sortBy;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.sortMenuItem,
                    selected && styles.sortMenuItemActive,
                  ]}
                  onPress={() => {
                    setSortBy(opt.value);
                    setSortMenuOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortMenuText,
                      selected && styles.sortMenuTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {selected ? <Check size={16} color={colors.primary} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      <MonthYearPickerModal
        visible={filterModalOpen}
        selectedMonth={selectedMonth}
        onSelect={setSelectedMonth}
        onClose={() => setFilterModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerCalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  headerCalText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  headerAlertBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  heroWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md + 2,
    gap: spacing.md,
    ...shadows.card,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 4,
  },
  avatarLg: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLgText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  profileInfo: {
    flex: 1,
    gap: 6,
  },
  customerName: {
    fontSize: fontSize.md + 1,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  phoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  phoneChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  agePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  agePillSettled: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
  },
  agePillWarning: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warningBorder,
  },
  agePillDanger: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
  },
  agePillText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  ageTextSettled: {
    color: colors.success,
  },
  ageTextWarning: {
    color: colors.warning,
  },
  ageTextDanger: {
    color: colors.danger,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  balanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  balanceEyebrow: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  balanceHeroAmt: {
    fontSize: 24,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.4,
  },
  pendingCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  pendingCountText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  progressSection: {
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  progressPct: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  twoColStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.sm + 2,
  },
  twoColCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  twoColDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  twoColLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  twoColVal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  greenText: {
    color: colors.success,
  },
  dangerText: {
    color: colors.danger,
  },
  stickySearchWrap: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 2,
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
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  sectionBadge: {
    backgroundColor: colors.surfacePressed,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  invoiceCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm + 4,
    overflow: 'hidden',
    ...shadows.card,
  },
  invoiceAccentBar: {
    width: 4,
  },
  invoiceInner: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.sm + 2,
  },
  invoiceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  invoiceNumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  invoiceNum: {
    fontSize: fontSize.sm + 1,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  unpaidBadge: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
  },
  partialBadge: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warningBorder,
  },
  statusText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  unpaidText: {
    color: colors.danger,
  },
  partialText: {
    color: colors.warning,
  },
  gstBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gstBadgeActive: {
    backgroundColor: colors.primarySoft,
    borderColor: '#BFDBFE',
  },
  gstText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  gstTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  itemsPreview: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
    gap: 5,
  },
  itemLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemName: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  itemAmt: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  moreItemsText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },
  invoiceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.sm + 2,
  },
  footerMetaCol: {
    gap: 3,
  },
  footerMetaLine: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  footerMetaBold: {
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  footerMetaPaid: {
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
  dueRightBox: {
    alignItems: 'flex-end',
  },
  dueCaption: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dueValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 1,
  },
  dueBigAmt: {
    fontSize: fontSize.md + 2,
    fontWeight: fontWeight.bold,
    color: colors.danger,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIconBox: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },
  sortMenu: {
    position: 'absolute',
    right: spacing.md,
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    ...shadows.floating,
  },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
  },
  sortMenuItemActive: {
    backgroundColor: colors.primarySoft,
  },
  sortMenuText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  sortMenuTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
});
