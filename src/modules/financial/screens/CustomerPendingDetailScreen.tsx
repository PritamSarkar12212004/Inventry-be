import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
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
  Check,
  ChevronRight,
  Clock,
  FileText,
  MapPin,
  Phone,
  Search,
  X,
} from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/types';
import { IosLoader } from '../../../core/components/IosLoader';
import { useDebounce } from '../../../core/hooks/useDebounce';
import { popup } from '../../../core/store/popupStore';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../core/theme';
import { inventoryStyles } from '../../inventory/styles';
import { useInfiniteSalesOrders } from '../../orders/hooks';
import type { OrderSortBy, SalesOrderRecord } from '../../orders/types';
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
  return `₹${Number(val || 0).toLocaleString('en-IN')}`;
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
  const { data: outstandingData, refetch: refetchOutstanding } =
    useCustomerOutstanding();

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
      totalPaid: routeCustomer.totalBilled,
      outstanding: 0,
      ageingDays: 0,
    };
  }, [outstandingData, routeCustomer]);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<OrderSortBy>('DATE_DESC');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(120);
  const sortBtnRef = useRef<React.ComponentRef<typeof View>>(null);
  const debouncedSearch = useDebounce(search.trim(), 300);

  const handleAlertPress = useCallback(() => {
    popup.info(
      'Customer Alert',
      'Send message / payment reminder feature coming soon.',
    );
  }, []);

  const renderAlertButton = useCallback(
    () => (
      <TouchableOpacity
        style={styles.headerAlertBtn}
        onPress={handleAlertPress}
        activeOpacity={0.75}
      >
        <Bell size={19} color={colors.primary} />
      </TouchableOpacity>
    ),
    [handleAlertPress],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: renderAlertButton,
    });
  }, [navigation, renderAlertButton]);

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
  );

  const orders = useMemo(() => {
    const raw = data?.pages.flatMap((p) => p.items) ?? [];
    if (customer.customerId) return raw;
    return raw.filter(
      (o) =>
        (customer.phone && o.customerSnapshot?.phone === customer.phone) ||
        o.customerSnapshot?.name === customer.customerName,
    );
  }, [data, customer.customerId, customer.phone, customer.customerName]);

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
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatarLg}>
              <Text style={styles.avatarLgText}>
                {getInitials(customer.customerName)}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.customerName} numberOfLines={2}>
                  {customer.customerName}
                </Text>
                <View
                  style={[
                    styles.agePill,
                    isSettled
                      ? styles.agePillSettled
                      : isOverdue
                        ? styles.agePillDanger
                        : styles.agePillNeutral,
                  ]}
                >
                  {isSettled ? (
                    <Check size={12} color={colors.success} />
                  ) : (
                    <Clock
                      size={12}
                      color={isOverdue ? colors.danger : colors.textSecondary}
                    />
                  )}
                  <Text
                    style={[
                      styles.agePillText,
                      isSettled
                        ? styles.ageTextSettled
                        : isOverdue
                          ? styles.ageTextDanger
                          : styles.ageTextNeutral,
                    ]}
                  >
                    {isSettled
                      ? 'Settled'
                      : customer.ageingDays === 0
                        ? 'Today'
                        : `${customer.ageingDays}d pending`}
                  </Text>
                </View>
              </View>

              <View style={styles.contactChipsRow}>
                {customer.phone ? (
                  <TouchableOpacity
                    style={styles.phoneChip}
                    onPress={() => Linking.openURL(`tel:${customer.phone}`)}
                    activeOpacity={0.75}
                  >
                    <Phone size={13} color={colors.primary} />
                    <Text style={styles.phoneChipText}>{customer.phone}</Text>
                  </TouchableOpacity>
                ) : null}

                {customer.billingAddress ? (
                  <View style={styles.addressRow}>
                    <MapPin size={13} color={colors.textMuted} />
                    <Text style={styles.addressText} numberOfLines={1}>
                      {customer.billingAddress}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

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

          <View style={styles.summaryRow}>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Pending</Text>
              <Text style={styles.summaryVal}>
                {customer.pendingOrdersCount}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Billed</Text>
              <Text style={styles.summaryVal}>
                {fmtMoney(customer.totalBilled)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Paid</Text>
              <Text style={[styles.summaryVal, styles.greenText]}>
                {fmtMoney(customer.totalPaid)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Balance</Text>
              <Text style={[styles.summaryVal, styles.dangerText]}>
                {fmtMoney(customer.outstanding)}
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
          <Text style={styles.sectionTitle}>Pending Invoices</Text>
          <Text style={styles.sectionCount}>
            {orders.length} {orders.length === 1 ? 'invoice' : 'invoices'}
          </Text>
        </View>
      );
    }

    if (item.kind === 'EMPTY') {
      return isLoading ? (
        <PendingInvoicesSkeleton />
      ) : (
        <View style={styles.emptyBox}>
          <FileText size={30} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No pending invoices found</Text>
          <Text style={styles.emptySub}>
            {debouncedSearch
              ? 'Try clearing your search filter.'
              : 'All invoices for this customer are paid.'}
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
    const isUnpaid = order.paymentStatus === 'UNPAID';
    const visibleItems = order.items.slice(0, 3);
    const extraCount = Math.max(0, order.items.length - 3);

    return (
      <TouchableOpacity
        style={styles.invoiceCard}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('SalesOrderDetail', { orderId: order._id })
        }
      >
        <View style={styles.invoiceTopRow}>
          <View style={styles.invoiceNumWrap}>
            <Text style={styles.invoiceNum}>{order.orderNumber}</Text>
            <View
              style={[
                styles.statusBadge,
                isUnpaid ? styles.unpaidBadge : styles.partialBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isUnpaid ? styles.unpaidText : styles.partialText,
                ]}
              >
                {isUnpaid ? 'UNPAID' : 'PARTIAL'}
              </Text>
            </View>
            <View style={styles.gstBadge}>
              <Text style={styles.gstText}>
                {order.includeGst !== false ? 'GST' : 'No GST'}
              </Text>
            </View>
          </View>

          <Text style={styles.dateText}>{formatDate(order.orderDate)}</Text>
        </View>

        <View style={styles.itemsPreview}>
          {visibleItems.map((line, idx) => (
            <View key={`${order._id}-item-${idx}`} style={styles.itemLine}>
              <Text style={styles.itemName} numberOfLines={1}>
                {line.productName} × {line.orderedQuantity} {line.unit || ''}
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

        <View style={styles.invoiceProgressTrack}>
          <View
            style={[styles.invoiceProgressFill, { width: `${paidPct}%` }]}
          />
        </View>

        <View style={styles.amountsRow}>
          <View style={styles.amountCol}>
            <Text style={styles.amountLabel}>Invoice Total</Text>
            <Text style={styles.amountVal}>{fmtMoney(grandTotal)}</Text>
          </View>

          <View style={styles.amountCol}>
            <Text style={styles.amountLabel}>Paid ({paidPct}%)</Text>
            <Text style={[styles.amountVal, styles.greenText]}>
              {fmtMoney(paid)}
            </Text>
          </View>

          <View style={styles.amountColRight}>
            <Text style={styles.amountLabel}>Balance</Text>
            <View style={styles.dueActionRow}>
              <Text style={[styles.amountVal, styles.dangerText]}>
                {fmtMoney(due)}
              </Text>
              <ChevronRight size={15} color={colors.primary} />
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
                  style={styles.sortMenuItem}
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
    </View>
  );
}

const styles = StyleSheet.create({
  headerAlertBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  avatarLg: {
    width: 50,
    height: 50,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
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
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  customerName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  agePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  agePillNeutral: {
    backgroundColor: colors.surfacePressed,
  },
  agePillDanger: {
    backgroundColor: colors.dangerBg,
  },
  agePillSettled: {
    backgroundColor: colors.successBg,
  },
  agePillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  ageTextNeutral: {
    color: colors.textSecondary,
  },
  ageTextDanger: {
    color: colors.danger,
  },
  ageTextSettled: {
    color: colors.success,
  },
  contactChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  phoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  phoneChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  addressText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  progressSection: {
    marginTop: spacing.md,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  progressPct: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfacePressed,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: radius.full,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryCell: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  summaryVal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    height: 42,
    gap: spacing.xs,
  },
  sortBtn: {
    width: 42,
    height: 42,
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  sectionCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  invoiceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  invoiceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  invoiceNumWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  invoiceNum: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  unpaidBadge: {
    backgroundColor: colors.dangerBg,
  },
  partialBadge: {
    backgroundColor: colors.warningBg,
  },
  statusText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  unpaidText: {
    color: colors.danger,
  },
  partialText: {
    color: colors.warning,
  },
  gstBadge: {
    backgroundColor: colors.surfacePressed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  gstText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  itemsPreview: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  itemLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  itemName: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  itemAmt: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  moreItemsText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  invoiceProgressTrack: {
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surfacePressed,
    overflow: 'hidden',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  invoiceProgressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: radius.full,
  },
  amountsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountCol: {
    flex: 1,
  },
  amountColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  amountVal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 1,
  },
  dueActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
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
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  sortMenu: {
    position: 'absolute',
    right: spacing.md,
    width: 210,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
  },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sortMenuText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  sortMenuTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
});
