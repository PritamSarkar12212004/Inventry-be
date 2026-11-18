import React, { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
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
  AlertCircle,
  ArrowUpDown,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Phone,
  Search,
  Wallet,
  X,
} from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/types';
import { useDebounce } from '../../../core/hooks/useDebounce';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../core/theme';
import { inventoryStyles } from '../../inventory/styles';
import { useCustomerOutstanding, useFinancialOverview } from '../hooks';
import {
  FinancialOverviewSkeleton,
  PendingCustomersListSkeleton,
} from '../skeletons';
import type { CustomerOutstandingItem } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

type FinanceSortBy =
  | 'OUTSTANDING_DESC'
  | 'OUTSTANDING_ASC'
  | 'DAYS_DESC'
  | 'DAYS_ASC'
  | 'INVOICES_DESC';

const FINANCE_SORT_OPTIONS: Array<{ label: string; value: FinanceSortBy }> = [
  { label: 'Amount: High → Low', value: 'OUTSTANDING_DESC' },
  { label: 'Days: Oldest Pending', value: 'DAYS_DESC' },
  { label: 'Days: Newest Pending', value: 'DAYS_ASC' },
  { label: 'Amount: Low → High', value: 'OUTSTANDING_ASC' },
  { label: 'Invoices: High → Low', value: 'INVOICES_DESC' },
];

function fmtMoney(val?: number): string {
  return `₹${Number(val || 0).toLocaleString('en-IN')}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'C';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
}

export function FinancialScreen() {
  const navigation = useNavigation<NavProp>();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<FinanceSortBy>('OUTSTANDING_DESC');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(120);
  const sortBtnRef = useRef<React.ComponentRef<typeof View>>(null);
  const debouncedSearch = useDebounce(search.trim(), 300);

  const handleOpenSortMenu = () => {
    sortBtnRef.current?.measureInWindow((_x, y, _w, height) => {
      setMenuTop(y + height + 6);
      setSortMenuOpen(true);
    });
  };

  const {
    data: overview,
    isLoading: overviewLoading,
    isRefetching: overviewRefetching,
    refetch: refetchOverview,
  } = useFinancialOverview();

  const {
    data: outstandingData,
    isLoading: outstandingLoading,
    isRefetching: outstandingRefetching,
    refetch: refetchOutstanding,
  } = useCustomerOutstanding(debouncedSearch || undefined);

  const customers = useMemo(() => {
    const raw = outstandingData?.customers ?? [];
    const list = [...raw];
    switch (sortBy) {
      case 'DAYS_DESC':
        return list.sort((a, b) => b.ageingDays - a.ageingDays);
      case 'DAYS_ASC':
        return list.sort((a, b) => a.ageingDays - b.ageingDays);
      case 'OUTSTANDING_ASC':
        return list.sort((a, b) => a.outstanding - b.outstanding);
      case 'INVOICES_DESC':
        return list.sort(
          (a, b) => b.pendingOrdersCount - a.pendingOrdersCount,
        );
      case 'OUTSTANDING_DESC':
      default:
        return list.sort((a, b) => b.outstanding - a.outstanding);
    }
  }, [outstandingData?.customers, sortBy]);

  const activeSortLabel =
    FINANCE_SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label ??
    'Amount: High → Low';

  const totalReceived = Number(overview?.totalReceived || 0);
  const totalPurchases = Number(overview?.totalPurchases || 0);
  const netCashflow = totalReceived - totalPurchases;
  const totalReceivable = Number(
    outstandingData?.totalReceivable ?? overview?.totalPendingDue ?? 0,
  );

  const isInitialLoading = overviewLoading && !overview;
  const isRefreshing = overviewRefetching || outstandingRefetching;

  const handleRefresh = () => {
    refetchOverview();
    refetchOutstanding();
  };

  if (isInitialLoading) {
    return <FinancialOverviewSkeleton />;
  }

  const listHeader = (
    <View>
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Total Sales</Text>
          <Text style={styles.kpiVal}>{fmtMoney(overview?.totalSales)}</Text>
          <Text style={styles.kpiSub}>
            {overview?.totalOrders ?? 0} Orders
          </Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Received</Text>
          <Text style={[styles.kpiVal, styles.greenText]}>
            {fmtMoney(overview?.totalReceived)}
          </Text>
          <Text style={styles.kpiSub}>
            Pending: {fmtMoney(overview?.totalPendingDue)}
          </Text>
        </View>

        <View style={styles.kpiCardFull}>
          <View>
            <Text style={styles.kpiLabel}>Purchases</Text>
            <Text style={styles.kpiSub}>
              {overview?.totalPurchaseEntries ?? 0} Entries
            </Text>
          </View>
          <Text style={styles.kpiVal}>
            {fmtMoney(overview?.totalPurchases)}
          </Text>
        </View>
      </View>

      <View style={styles.netCard}>
        <View style={styles.netLeft}>
          <Wallet size={18} color={colors.primary} />
          <View>
            <Text style={styles.netLabel}>Net Cashflow</Text>
            <Text style={styles.netHint}>Received − Purchases</Text>
          </View>
        </View>
        <Text
          style={[
            styles.netVal,
            netCashflow < 0 ? styles.negText : styles.greenText,
          ]}
        >
          {netCashflow < 0
            ? `-₹${Math.abs(netCashflow).toLocaleString('en-IN')}`
            : fmtMoney(netCashflow)}
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Pending Customer Payments</Text>
          <Text style={styles.sectionSub}>
            {customers.length} customer{customers.length === 1 ? '' : 's'} with pending balance
          </Text>
        </View>
        <View style={styles.receivableBadge}>
          <Text style={styles.receivableBadgeText}>
            Pending: {fmtMoney(totalReceivable)}
          </Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={17} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customer name or phone..."
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
              sortBy !== 'OUTSTANDING_DESC' && styles.sortBtnActive,
            ]}
            onPress={handleOpenSortMenu}
            activeOpacity={0.8}
          >
            <ArrowUpDown
              size={18}
              color={
                sortBy !== 'OUTSTANDING_DESC'
                  ? colors.primary
                  : colors.textSecondary
              }
            />
          </TouchableOpacity>
        </View>
      </View>

      {sortBy !== 'OUTSTANDING_DESC' ? (
        <View style={styles.activeSortRow}>
          <TouchableOpacity
            style={inventoryStyles.activeFilterChip}
            onPress={() => setSortBy('OUTSTANDING_DESC')}
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

  const renderCustomerCard = ({ item }: { item: CustomerOutstandingItem }) => {
    const paidPct =
      item.totalBilled > 0
        ? Math.min(100, Math.round((item.totalPaid / item.totalBilled) * 100))
        : 0;
    const isOverdue = item.ageingDays >= 30;

    return (
      <TouchableOpacity
        style={styles.customerCard}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('CustomerPendingDetail', { customer: item })
        }
      >
        <View style={styles.cardTopRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(item.customerName)}</Text>
          </View>

          <View style={styles.customerMeta}>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.customerName}
            </Text>
            <View style={styles.phoneRow}>
              <Phone size={12} color={colors.textMuted} />
              <Text style={styles.phoneText}>
                {item.phone ? item.phone : 'No phone'}
              </Text>
            </View>
          </View>

          <View style={styles.dueRight}>
            <Text style={styles.dueAmount}>{fmtMoney(item.outstanding)}</Text>
            <View style={styles.viewRow}>
              <Text style={styles.viewText}>View Invoices</Text>
              <ChevronRight size={14} color={colors.primary} />
            </View>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${paidPct}%` }]} />
        </View>

        <View style={styles.cardFooterRow}>
          <View style={styles.footerLeft}>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>
                {item.pendingOrdersCount} Pending{' '}
                {item.pendingOrdersCount === 1 ? 'Invoice' : 'Invoices'}
              </Text>
            </View>

            <View
              style={[
                styles.ageBadge,
                isOverdue ? styles.ageBadgeDanger : styles.ageBadgeNeutral,
              ]}
            >
              <Clock
                size={11}
                color={isOverdue ? colors.danger : colors.textSecondary}
              />
              <Text
                style={[
                  styles.ageBadgeText,
                  isOverdue ? styles.ageTextDanger : styles.ageTextNeutral,
                ]}
              >
                {item.ageingDays === 0 ? 'Today' : `${item.ageingDays}d old`}
              </Text>
            </View>

            {item.creditLimitExceeded ? (
              <View style={styles.limitBadge}>
                <AlertCircle size={11} color={colors.warning} />
                <Text style={styles.limitBadgeText}>Over Limit</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.paidRatioText}>
            Paid {fmtMoney(item.totalPaid)} / {fmtMoney(item.totalBilled)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={inventoryStyles.screen}>
      <FlatList
        data={customers}
        keyExtractor={(item, idx) =>
          item.customerId || `walkin-${item.phone || item.customerName}-${idx}`
        }
        renderItem={renderCustomerCard}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          outstandingLoading ? (
            <PendingCustomersListSkeleton />
          ) : (
            <View style={styles.emptyBox}>
              <CheckCircle2 size={32} color={colors.success} />
              <Text style={styles.emptyTitle}>
                {debouncedSearch
                  ? 'No matching pending customers'
                  : 'All customer payments settled'}
              </Text>
              <Text style={styles.emptySub}>
                {debouncedSearch
                  ? 'Try a different customer name or phone number.'
                  : 'Pending invoices will automatically appear here.'}
              </Text>
            </View>
          )
        }
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
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
            {FINANCE_SORT_OPTIONS.map((opt) => {
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
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  kpiCardFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  kpiLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  kpiVal: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 4,
  },
  kpiSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  greenText: {
    color: colors.success,
  },
  negText: {
    color: colors.danger,
  },
  netCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  netLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  netLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  netHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  netVal: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  sectionSub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  receivableBadge: {
    backgroundColor: colors.dangerBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  receivableBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.danger,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
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
  activeSortRow: {
    flexDirection: 'row',
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  customerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  customerMeta: {
    flex: 1,
  },
  customerName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  phoneText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  dueRight: {
    alignItems: 'flex-end',
  },
  dueAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.danger,
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  viewText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  progressTrack: {
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.surfacePressed,
    overflow: 'hidden',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: radius.full,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  countPill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.xs + 4,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  countPillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  ageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs + 4,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  ageBadgeNeutral: {
    backgroundColor: colors.surfacePressed,
  },
  ageBadgeDanger: {
    backgroundColor: colors.dangerBg,
  },
  ageBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  ageTextNeutral: {
    color: colors.textSecondary,
  },
  ageTextDanger: {
    color: colors.danger,
  },
  limitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.warningBg,
    paddingHorizontal: spacing.xs + 4,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  limitBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.warning,
  },
  paidRatioText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
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
    textAlign: 'center',
  },
  emptySub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  sortMenu: {
    position: 'absolute',
    right: spacing.md,
    width: 215,
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
