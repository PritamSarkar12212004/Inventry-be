import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowDownLeft,
  ArrowUpDown,
  ArrowUpRight,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Package,
  Phone,
  Receipt,
  Search,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react-native';
import type { AxiosError } from 'axios';
import { SkeletonBox } from '../../../core/components/SkeletonBox';
import type { RootStackParamList } from '../../../core/navigation/types';
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
import { useSendAllPaymentReminders } from '../../orders/hooks';
import {
  MonthYearPickerModal,
  getMonthRange,
  type SelectedMonth,
} from '../components';
import {
  useCustomerOutstanding,
  useFinancialOverview,
  useInfiniteFinancialTransactions,
} from '../hooks';
import {
  FinancialOverviewSkeleton,
  PendingCustomersListSkeleton,
} from '../skeletons';
import type {
  CustomerOutstandingItem,
  FinancialTransactionItem,
  FinancialTransactionType,
} from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

type FinanceTab = 'OVERVIEW' | 'PENDING';

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

const TX_FILTER_CHIPS: Array<{
  key: FinancialTransactionType;
  label: string;
}> = [
  { key: 'ALL', label: 'All' },
  { key: 'IN', label: 'Cash In' },
  { key: 'OUT', label: 'Cash Out' },
  { key: 'SALES_PAYMENT', label: 'Sales' },
  { key: 'PURCHASE', label: 'Suppliers' },
  { key: 'GENERAL_EXPENSE', label: 'General Expenses' },
  { key: 'MANPOWER', label: 'Manpower' },
];

const TX_TYPE_LABELS: Record<FinancialTransactionItem['type'], string> = {
  SALES_PAYMENT: 'Sales Order',
  PURCHASE: 'Supplier',
  GENERAL_EXPENSE: 'General Expense',
  MANPOWER: 'Manpower',
};

function fmtMoney(val?: number): string {
  return `₹${Math.round(Number(val || 0)).toLocaleString('en-IN')}`;
}

function fmtSignedMoney(val?: number): string {
  const n = Math.round(Number(val || 0));
  const abs = Math.abs(n).toLocaleString('en-IN');
  if (n < 0) return `-₹${abs}`;
  if (n > 0) return `+₹${abs}`;
  return '₹0';
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

export function FinancialScreen() {
  const navigation = useNavigation<NavProp>();
  const [activeTab, setActiveTab] = useState<FinanceTab>('OVERVIEW');

  const [selectedMonth, setSelectedMonth] = useState<SelectedMonth>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const monthRange = useMemo(
    () =>
      selectedMonth
        ? getMonthRange(selectedMonth.year, selectedMonth.month)
        : null,
    [selectedMonth],
  );
  const periodLabel = monthRange?.label ?? 'All Time';

  const [txType, setTxType] = useState<FinancialTransactionType>('ALL');
  const [txSearch, setTxSearch] = useState('');
  const debouncedTxSearch = useDebounce(txSearch.trim(), 300);

  const [pendingSearch, setPendingSearch] = useState('');
  const debouncedPendingSearch = useDebounce(pendingSearch.trim(), 300);
  const [sortBy, setSortBy] = useState<FinanceSortBy>('OUTSTANDING_DESC');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(120);
  const sortBtnRef = useRef<React.ComponentRef<typeof View>>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Finance',
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerCalBtn}
          activeOpacity={0.75}
          onPress={() => setFilterModalOpen(true)}
        >
          <Calendar size={15} color={colors.textPrimary} />
          <Text style={styles.headerCalText}>{periodLabel}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, periodLabel]);

  const {
    data: overview,
    isLoading: overviewLoading,
    isRefetching: overviewRefetching,
    refetch: refetchOverview,
  } = useFinancialOverview(monthRange?.startDate, monthRange?.endDate);

  const {
    data: txData,
    isLoading: txLoading,
    isFetching: txFetching,
    isRefetching: txRefetching,
    fetchNextPage: fetchNextTxPage,
    hasNextPage: hasNextTxPage,
    isFetchingNextPage: isFetchingNextTxPage,
    refetch: refetchTx,
  } = useInfiniteFinancialTransactions({
    startDate: monthRange?.startDate,
    endDate: monthRange?.endDate,
    type: txType,
    search: debouncedTxSearch || undefined,
    limit: 15,
  });

  const {
    data: outstandingData,
    isLoading: outstandingLoading,
    isRefetching: outstandingRefetching,
    refetch: refetchOutstanding,
  } = useCustomerOutstanding(
    debouncedPendingSearch || undefined,
    monthRange?.startDate,
    monthRange?.endDate,
  );

  const { mutate: sendAllReminders, isPending: isSendingAllReminders } =
    useSendAllPaymentReminders();

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

  const pendingCount = outstandingData?.customers?.length ?? 0;
  const totalReceivable = Number(
    outstandingData?.totalReceivable ?? overview?.totalPendingDue ?? 0,
  );
  const activeSortLabel =
    FINANCE_SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label ??
    'Amount: High → Low';

  const transactions = useMemo(
    () => txData?.pages.flatMap((p) => p.transactions) ?? [],
    [txData?.pages],
  );
  const txSummary = txData?.pages[0]?.summary;

  const totalSales = Math.max(overview?.totalSales || 0, 0);
  const totalReceived = Math.max(overview?.totalReceived || 0, 0);
  const totalPurchases = Math.max(overview?.totalPurchases || 0, 0);
  const totalExpenses = Math.max(overview?.totalExpenses || 0, 0);
  const totalGeneralExpenses = Math.max(
    overview?.totalGeneralExpenses ?? totalExpenses,
    0,
  );
  const totalManpowerExpenses = Math.max(
    overview?.totalManpowerExpenses ?? 0,
    0,
  );
  const totalOutflow = totalPurchases + totalExpenses;
  const balanceAmount =
    overview?.netCashflow ?? totalReceived - totalPurchases - totalExpenses;
  const isProfit = balanceAmount >= 0;
  const collectedPct =
    totalSales > 0
      ? Math.min(100, Math.round((totalReceived / totalSales) * 100))
      : 0;

  const handleOpenSortMenu = () => {
    sortBtnRef.current?.measureInWindow((_x, y, _w, height) => {
      setMenuTop(y + height + 6);
      setSortMenuOpen(true);
    });
  };

  const handleRefreshOverview = () => {
    refetchOverview();
    refetchTx();
    refetchOutstanding();
  };

  const handleRefreshPending = () => {
    refetchOutstanding();
    refetchOverview();
  };

  const handleRemindAll = () => {
    if (isSendingAllReminders) return;
    if (customers.length === 0) {
      popup.info(
        'Payment Reminders',
        'All customer payments are up to date.',
      );
      return;
    }
    sendAllReminders(undefined, {
      onSuccess: (res) => {
        popup.success(
          'Reminders Started',
          res.message ||
            `Sending reminders to ${customers.length} customers (20s gap).`,
        );
      },
      onError: (err) => {
        const axiosErr = err as AxiosError<{ message?: string }>;
        popup.error(
          'Reminder Failed',
          axiosErr.response?.data?.message ||
            'Unable to start bulk payment reminders.',
        );
      },
    });
  };

  const renderOverviewHeader = () => (
    <View>
      {/* Executive Net Cashflow Card */}
      <TouchableOpacity
        style={styles.heroCard}
        activeOpacity={0.92}
        onPress={() => navigation.navigate('FinancialOverviewDetail')}
      >
        <View style={styles.heroTopRow}>
          <View style={styles.heroTitleWrap}>
            <Text style={styles.heroEyebrow}>
              NET BALANCE • {periodLabel.toUpperCase()}
            </Text>
            <Text style={styles.heroBalance} numberOfLines={1}>
              {fmtSignedMoney(balanceAmount)}
            </Text>
          </View>
          <View style={styles.heroRightCol}>
            <View style={styles.statusChip}>
              <View
                style={[
                  styles.statusDot,
                  isProfit ? styles.dotPos : styles.dotNeg,
                ]}
              />
              <Text style={styles.statusChipText}>
                {isProfit ? 'Profit' : 'Loss'}
              </Text>
            </View>
            <View style={styles.reportLinkRow}>
              <Text style={styles.reportLinkText}>Full Report</Text>
              <ChevronRight size={13} color={colors.primary} />
            </View>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.collectionRow}>
            <Text style={styles.collectionLabel}>Collection Rate</Text>
            <Text style={styles.collectionPct}>{collectedPct}%</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${collectedPct}%` }]} />
          </View>
        </View>

        <View style={styles.flowStrip}>
          <View style={styles.flowCol}>
            <View style={styles.flowLabelRow}>
              <ArrowDownLeft size={13} color={colors.success} />
              <Text style={styles.flowLabel}>Cash In</Text>
            </View>
            <Text style={styles.flowVal} numberOfLines={1}>
              {fmtMoney(totalReceived)}
            </Text>
          </View>

          <View style={styles.flowDivider} />

          <View style={styles.flowCol}>
            <View style={styles.flowLabelRow}>
              <ArrowUpRight size={13} color={colors.textSecondary} />
              <Text style={styles.flowLabel}>Cash Out</Text>
            </View>
            <Text style={styles.flowVal} numberOfLines={1}>
              {fmtMoney(totalOutflow)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Brand-Blue Cohesive Finance Breakdown Grid */}
      <Text style={styles.sectionLabel}>FINANCIAL SUMMARY</Text>
      <View style={styles.moduleGrid}>
        <TouchableOpacity
          style={styles.moduleCard}
          activeOpacity={0.78}
          onPress={() => navigation.navigate('SalesOverviewDetail')}
        >
          <View style={styles.moduleTop}>
            <View style={styles.moduleIcon}>
              <TrendingUp size={15} color={colors.primary} />
            </View>
            <ChevronRight size={14} color={colors.textMuted} />
          </View>
          <Text style={styles.moduleTitle}>Total Sales</Text>
          <Text style={styles.moduleVal} numberOfLines={1}>
            {fmtMoney(totalSales)}
          </Text>
          <Text style={styles.moduleSub} numberOfLines={1}>
            {overview?.totalOrders ?? 0} orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moduleCard}
          activeOpacity={0.78}
          onPress={() => navigation.navigate('SupplierOverviewDetail')}
        >
          <View style={styles.moduleTop}>
            <View style={styles.moduleIcon}>
              <ShoppingBag size={15} color={colors.primary} />
            </View>
            <ChevronRight size={14} color={colors.textMuted} />
          </View>
          <Text style={styles.moduleTitle}>Suppliers</Text>
          <Text style={styles.moduleVal} numberOfLines={1}>
            {fmtMoney(totalPurchases)}
          </Text>
          <Text style={styles.moduleSub} numberOfLines={1}>
            {overview?.totalPurchaseEntries ?? 0} bills
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moduleCard}
          activeOpacity={0.78}
          onPress={() => navigation.navigate('GeneralExpenses')}
        >
          <View style={styles.moduleTop}>
            <View style={styles.moduleIcon}>
              <Receipt size={15} color={colors.primary} />
            </View>
            <ChevronRight size={14} color={colors.textMuted} />
          </View>
          <Text style={styles.moduleTitle}>General Expenses</Text>
          <Text style={styles.moduleVal} numberOfLines={1}>
            {fmtMoney(totalGeneralExpenses)}
          </Text>
          <Text style={styles.moduleSub} numberOfLines={1}>
            {overview?.generalExpenseCount ?? 0} records
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moduleCard}
          activeOpacity={0.78}
          onPress={() => navigation.navigate('ManpowerExpenses')}
        >
          <View style={styles.moduleTop}>
            <View style={styles.moduleIcon}>
              <Users size={15} color={colors.primary} />
            </View>
            <ChevronRight size={14} color={colors.textMuted} />
          </View>
          <Text style={styles.moduleTitle}>Manpower</Text>
          <Text style={styles.moduleVal} numberOfLines={1}>
            {fmtMoney(totalManpowerExpenses)}
          </Text>
          <Text style={styles.moduleSub} numberOfLines={1}>
            {overview?.manpowerExpenseCount ?? 0} entries
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moduleCard}
          activeOpacity={0.78}
          onPress={() => setActiveTab('PENDING')}
        >
          <View style={styles.moduleTop}>
            <View style={styles.moduleIcon}>
              <Clock size={15} color={colors.primary} />
            </View>
            <ChevronRight size={14} color={colors.textMuted} />
          </View>
          <Text style={styles.moduleTitle}>Pending Due</Text>
          <Text style={styles.moduleVal} numberOfLines={1}>
            {fmtMoney(totalReceivable)}
          </Text>
          <Text style={styles.moduleSub} numberOfLines={1}>
            {pendingCount} {pendingCount === 1 ? 'customer' : 'customers'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moduleCard}
          activeOpacity={0.78}
          onPress={() => navigation.navigate('FinancialOverviewDetail')}
        >
          <View style={styles.moduleTop}>
            <View style={styles.moduleIcon}>
              <Package size={15} color={colors.primary} />
            </View>
            <ChevronRight size={14} color={colors.textMuted} />
          </View>
          <Text style={styles.moduleTitle}>Stock Value</Text>
          <Text style={styles.moduleVal} numberOfLines={1}>
            {fmtMoney(overview?.totalStockValue)}
          </Text>
          <Text style={styles.moduleSub} numberOfLines={1}>
            Inventory asset
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transactions Ledger Header */}
      <View style={styles.ledgerHeader}>
        <Text style={styles.ledgerTitle}>Transactions</Text>
        <Text style={styles.ledgerCount}>
          {txSummary?.totalCount ?? transactions.length} entries
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBox, styles.ledgerSearchBox]}>
        <Search size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customer, supplier, expense, ref #..."
          placeholderTextColor={colors.textMuted}
          value={txSearch}
          onChangeText={setTxSearch}
        />
        {txSearch.length > 0 ? (
          <TouchableOpacity onPress={() => setTxSearch('')} hitSlop={8}>
            <X size={15} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Monochrome Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsRow}
      >
        {TX_FILTER_CHIPS.map((chip) => {
          const active = txType === chip.key;
          return (
            <TouchableOpacity
              key={chip.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setTxType(chip.key)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterChipText,
                  active && styles.filterChipTextActive,
                ]}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderTransactionCard = ({
    item,
  }: {
    item: FinancialTransactionItem;
  }) => {
    const isIn = item.direction === 'IN';
    const canOpenOrder = item.type === 'SALES_PAYMENT' && Boolean(item.orderId);

    return (
      <TouchableOpacity
        style={styles.txCard}
        activeOpacity={canOpenOrder ? 0.75 : 1}
        disabled={!canOpenOrder}
        onPress={() => {
          if (item.orderId) {
            navigation.navigate('SalesOrderDetail', { orderId: item.orderId });
          }
        }}
      >
        <View style={styles.txIconBox}>
          {isIn ? (
            <ArrowDownLeft size={16} color={colors.success} />
          ) : (
            <ArrowUpRight size={16} color={colors.textSecondary} />
          )}
        </View>

        <View style={styles.txBody}>
          <View style={styles.txTopRow}>
            <Text style={styles.txTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text
              style={[styles.txAmount, isIn ? styles.inAmtText : styles.outAmtText]}
              numberOfLines={1}
            >
              {isIn ? '+' : '-'}
              {fmtMoney(item.amount)}
            </Text>
          </View>

          <Text style={styles.txSubtitle} numberOfLines={1}>
            {item.subtitle}
            {item.referenceNumber ? ` · ${item.referenceNumber}` : ''}
          </Text>

          <View style={styles.txBottomRow}>
            <View style={styles.txMetaPills}>
              <Text style={styles.txNeutralPill}>
                {TX_TYPE_LABELS[item.type]}
              </Text>
            </View>
            <Text style={styles.txDate}>{formatDate(item.date)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPendingHeader = () => (
    <View>
      <View style={styles.pendingHero}>
        <View style={styles.pendingHeroTop}>
          <View style={styles.pendingHeroMeta}>
            <Text style={styles.heroEyebrow}>TOTAL RECEIVABLE</Text>
            <Text style={styles.pendingHeroAmount}>
              {fmtMoney(totalReceivable)}
            </Text>
            <Text style={styles.pendingHeroSub}>
              {customers.length}{' '}
              {customers.length === 1 ? 'customer' : 'customers'} pending
            </Text>
          </View>

          <TouchableOpacity
            style={styles.remindAllBtn}
            onPress={handleRemindAll}
            activeOpacity={0.8}
            disabled={isSendingAllReminders}
          >
            {isSendingAllReminders ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <>
                <Bell size={14} color={colors.surface} />
                <Text style={styles.remindAllText}>Remind All</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customer name or phone..."
            placeholderTextColor={colors.textMuted}
            value={pendingSearch}
            onChangeText={setPendingSearch}
          />
          {pendingSearch.length > 0 ? (
            <TouchableOpacity onPress={() => setPendingSearch('')} hitSlop={8}>
              <X size={15} color={colors.textMuted} />
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
              size={16}
              color={
                sortBy !== 'OUTSTANDING_DESC'
                  ? colors.surface
                  : colors.textSecondary
              }
            />
          </TouchableOpacity>
        </View>
      </View>

      {sortBy !== 'OUTSTANDING_DESC' ? (
        <View style={styles.activeSortRow}>
          <TouchableOpacity
            style={styles.activeSortChip}
            onPress={() => setSortBy('OUTSTANDING_DESC')}
          >
            <Text style={styles.activeSortText}>Sort: {activeSortLabel}</Text>
            <X size={13} color={colors.primary} />
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

    return (
      <TouchableOpacity
        style={styles.customerCard}
        activeOpacity={0.78}
        onPress={() =>
          navigation.navigate('CustomerPendingDetail', { customer: item })
        }
      >
        <View style={styles.cardTopRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(item.customerName)}
            </Text>
          </View>

          <View style={styles.customerMeta}>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.customerName}
            </Text>
            <View style={styles.phoneRow}>
              <Phone size={11} color={colors.textMuted} />
              <Text style={styles.phoneText}>
                {item.phone ? item.phone : 'No phone'}
              </Text>
            </View>
          </View>

          <View style={styles.dueRight}>
            <Text style={styles.dueAmount}>{fmtMoney(item.outstanding)}</Text>
            <View style={styles.viewRow}>
              <Text style={styles.viewText}>Invoices</Text>
              <ChevronRight size={13} color={colors.primary} />
            </View>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${paidPct}%` }]} />
        </View>

        <View style={styles.cardFooterRow}>
          <View style={styles.footerLeft}>
            <Text style={styles.txNeutralPill}>
              {item.pendingOrdersCount}{' '}
              {item.pendingOrdersCount === 1 ? 'Invoice' : 'Invoices'}
            </Text>
            <Text style={styles.txNeutralPill}>{item.ageingDays}d overdue</Text>
          </View>
          <Text style={styles.paidPctText}>{paidPct}% paid</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (overviewLoading && !overview) {
    return <FinancialOverviewSkeleton />;
  }

  return (
    <View style={inventoryStyles.screen}>
      {/* Clean Minimal Top Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'OVERVIEW' && styles.tabItemActive,
          ]}
          onPress={() => setActiveTab('OVERVIEW')}
          activeOpacity={0.8}
        >
          <Wallet
            size={15}
            color={
              activeTab === 'OVERVIEW' ? colors.primary : colors.textMuted
            }
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'OVERVIEW' && styles.tabLabelActive,
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'PENDING' && styles.tabItemActive,
          ]}
          onPress={() => setActiveTab('PENDING')}
          activeOpacity={0.8}
        >
          <Clock
            size={15}
            color={
              activeTab === 'PENDING' ? colors.primary : colors.textMuted
            }
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'PENDING' && styles.tabLabelActive,
            ]}
          >
            Pending
          </Text>
          {pendingCount > 0 ? (
            <View
              style={[
                styles.tabBadge,
                activeTab === 'PENDING' && styles.tabBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.tabBadgeText,
                  activeTab === 'PENDING' && styles.tabBadgeTextActive,
                ]}
              >
                {pendingCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {activeTab === 'OVERVIEW' ? (
        <FlatList
          data={
            txLoading || (txFetching && !txRefetching && !isFetchingNextTxPage)
              ? []
              : transactions
          }
          keyExtractor={(item) => item.id}
          renderItem={renderTransactionCard}
          ListHeaderComponent={renderOverviewHeader()}
          ListEmptyComponent={
            txLoading ||
            (txFetching && !txRefetching && !isFetchingNextTxPage) ? (
              <View style={styles.txSkeletonWrap}>
                {[0, 1, 2, 3].map((k) => (
                  <View key={k} style={styles.txCard}>
                    <SkeletonBox width={36} height={36} borderRadius={18} />
                    <View style={styles.txBody}>
                      <View style={styles.txTopRow}>
                        <SkeletonBox width="55%" height={14} borderRadius={4} />
                        <SkeletonBox width={70} height={14} borderRadius={4} />
                      </View>
                      <SkeletonBox
                        width="72%"
                        height={11}
                        borderRadius={4}
                        style={styles.skeletonMt6}
                      />
                      <View style={[styles.txBottomRow, styles.skeletonMt8]}>
                        <SkeletonBox width={82} height={18} borderRadius={9} />
                        <SkeletonBox width={68} height={11} borderRadius={4} />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Receipt size={28} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No transactions found</Text>
                <Text style={styles.emptySub}>
                  {debouncedTxSearch || txType !== 'ALL'
                    ? 'Try clearing your search or filter.'
                    : `No transactions recorded for ${periodLabel}.`}
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            isFetchingNextTxPage ? (
              <View style={styles.txCard}>
                <SkeletonBox width={36} height={36} borderRadius={18} />
                <View style={styles.txBody}>
                  <View style={styles.txTopRow}>
                    <SkeletonBox width="52%" height={14} borderRadius={4} />
                    <SkeletonBox width={68} height={14} borderRadius={4} />
                  </View>
                  <SkeletonBox
                    width="68%"
                    height={11}
                    borderRadius={4}
                    style={styles.skeletonMt6}
                  />
                </View>
              </View>
            ) : undefined
          }
          onEndReached={() => {
            if (hasNextTxPage && !isFetchingNextTxPage) {
              fetchNextTxPage();
            }
          }}
          onEndReachedThreshold={0.4}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={overviewRefetching || txRefetching}
              onRefresh={handleRefreshOverview}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item, idx) =>
            `${item.customerId || item.customerName}-${idx}`
          }
          renderItem={renderCustomerCard}
          ListHeaderComponent={renderPendingHeader()}
          ListEmptyComponent={
            outstandingLoading ? (
              <PendingCustomersListSkeleton />
            ) : (
              <View style={styles.emptyBox}>
                <CheckCircle2 size={30} color={colors.primary} />
                <Text style={styles.emptyTitle}>
                  {debouncedPendingSearch
                    ? 'No matching customers'
                    : 'All payments settled'}
                </Text>
                <Text style={styles.emptySub}>
                  {debouncedPendingSearch
                    ? 'Try a different customer name or phone.'
                    : 'No pending customer invoices at the moment.'}
                </Text>
              </View>
            )
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={outstandingRefetching}
              onRefresh={handleRefreshPending}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}

      <MonthYearPickerModal
        visible={filterModalOpen}
        selectedMonth={selectedMonth}
        onSelect={setSelectedMonth}
        onClose={() => setFilterModalOpen(false)}
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
          <View style={[styles.dropdownMenu, { top: menuTop }]}>
            {FINANCE_SORT_OPTIONS.map((opt) => {
              const selected = sortBy === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.dropdownItem,
                    selected && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setSortBy(opt.value);
                    setSortMenuOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      selected && styles.dropdownTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {selected ? (
                    <Check size={15} color={colors.primary} />
                  ) : null}
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
  headerCalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerCalText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  tabBadge: {
    minWidth: 19,
    height: 19,
    paddingHorizontal: 5,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeActive: {
    backgroundColor: colors.primary,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  tabBadgeTextActive: {
    color: colors.surface,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md + 2,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  heroTitleWrap: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heroBalance: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  heroRightCol: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotPos: {
    backgroundColor: colors.success,
  },
  dotNeg: {
    backgroundColor: colors.danger,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  reportLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reportLinkText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  collectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  collectionLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  collectionPct: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  barTrack: {
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  flowStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  flowCol: {
    flex: 1,
  },
  flowDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  flowLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  flowLabel: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  flowVal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginLeft: 2,
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  moduleCard: {
    width: '48.6%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  moduleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  moduleIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  moduleVal: {
    fontSize: fontSize.md + 1,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  moduleSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  inAmtText: {
    color: colors.success,
  },
  outAmtText: {
    color: colors.textPrimary,
  },
  ledgerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  ledgerTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  ledgerCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  ledgerSearchBox: {
    marginBottom: spacing.sm,
  },
  filterChipsRow: {
    gap: spacing.xs + 2,
    paddingBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.surface,
    fontWeight: fontWeight.semibold,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm + 4,
  },
  txIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfacePressed,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  txBody: {
    flex: 1,
  },
  txTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  txTitle: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  txAmount: {
    fontSize: fontSize.sm + 1,
    fontWeight: fontWeight.bold,
  },
  txSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 3,
  },
  txBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  txMetaPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txNeutralPill: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    backgroundColor: colors.surfacePressed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  txDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  txSkeletonWrap: {
    gap: 0,
  },
  skeletonMt6: {
    marginTop: 6,
  },
  skeletonMt8: {
    marginTop: 8,
  },
  pendingHero: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  pendingHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pendingHeroMeta: {
    flex: 1,
  },
  pendingHeroAmount: {
    fontSize: 26,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  pendingHeroSub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  remindAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  remindAllText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.surface,
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
  searchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    paddingVertical: 0,
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
    backgroundColor: colors.primary,
  },
  activeSortRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  activeSortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  activeSortText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
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
    gap: spacing.sm + 2,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize.xs + 1,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  customerMeta: {
    flex: 1,
  },
  customerName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
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
    color: colors.textMuted,
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
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    marginTop: spacing.sm + 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm + 2,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paidPctText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
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
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptySub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  dropdownMenu: {
    position: 'absolute',
    right: spacing.md,
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    ...shadows.card,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
  },
  dropdownItemActive: {
    backgroundColor: colors.primarySoft,
  },
  dropdownText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  dropdownTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
});
