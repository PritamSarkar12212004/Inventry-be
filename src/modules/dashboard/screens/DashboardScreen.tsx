import React, { useMemo } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Boxes,
  ChevronRight,
  FolderKanban,
  Layers,
  PackagePlus,
  Plus,
  QrCode,
  ShoppingCart,
} from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/types';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from '../../../core/theme';
import {
  useCustomerOutstanding,
  useFinancialOverview,
} from '../../financial/hooks';
import {
  useInfiniteInventoryList,
  useInventorySummary,
} from '../../inventory/hooks';
import { useInfiniteSalesOrders } from '../../orders/hooks';
import { DashboardSkeleton } from '../skeletons';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

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
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'C';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
}

export function DashboardScreen() {
  const navigation = useNavigation<NavProp>();

  const {
    data: overview,
    isLoading: overviewLoading,
    isRefetching: overviewRefetching,
    refetch: refetchOverview,
  } = useFinancialOverview();

  const {
    data: invSummary,
    isLoading: invLoading,
    isRefetching: invRefetching,
    refetch: refetchInv,
  } = useInventorySummary();

  const {
    data: outstandingData,
    isLoading: outLoading,
    refetch: refetchOut,
  } = useCustomerOutstanding();

  const {
    data: ordersPages,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useInfiniteSalesOrders(undefined, undefined, 'DATE_DESC');

  const {
    data: lowStockPages,
    refetch: refetchLowStock,
  } = useInfiniteInventoryList({
    stockFilter: 'LOW_STOCK',
    limit: 5,
  });

  const topPendingCustomers = useMemo(
    () => (outstandingData?.customers ?? []).slice(0, 4),
    [outstandingData?.customers],
  );

  const recentOrders = useMemo(
    () => (ordersPages?.pages.flatMap((p) => p.items) ?? []).slice(0, 4),
    [ordersPages],
  );

  const lowStockItems = useMemo(
    () => (lowStockPages?.pages.flatMap((p) => p.items) ?? []).slice(0, 4),
    [lowStockPages],
  );

  const isInitialLoading =
    (overviewLoading && !overview) ||
    (invLoading && !invSummary) ||
    (outLoading && !outstandingData) ||
    (ordersLoading && !ordersPages);

  const isRefreshing = overviewRefetching || invRefetching;

  const handleRefresh = () => {
    refetchOverview();
    refetchInv();
    refetchOut();
    refetchOrders();
    refetchLowStock();
  };

  const navigateTab = (tabName: string, subScreen?: string) => {
    const navAny = navigation as unknown as {
      navigate: (name: string, params?: Record<string, unknown>) => void;
    };
    if (subScreen) {
      navAny.navigate(tabName, { screen: subScreen });
    } else {
      navAny.navigate(tabName);
    }
  };

  if (isInitialLoading) {
    return (
      <View style={styles.screen}>
        <DashboardSkeleton />
      </View>
    );
  }

  const totalSales = Math.max(overview?.totalSales || 0, 0);
  const totalReceived = Math.max(overview?.totalReceived || 0, 0);
  const totalPurchases = Math.max(overview?.totalPurchases || 0, 0);
  const netCashflow = totalReceived - totalPurchases;
  const totalReceivable = Number(
    outstandingData?.totalReceivable ?? overview?.totalPendingDue ?? 0,
  );
  const collectedPct =
    totalSales > 0
      ? Math.min(100, Math.round((totalReceived / totalSales) * 100))
      : 0;

  const totalProducts = Math.max(invSummary?.totalProducts ?? 0, 0);
  const inStock = Math.max(invSummary?.inStockCount ?? 0, 0);
  const lowStock = Math.max(invSummary?.lowStockCount ?? 0, 0);
  const outStock = Math.max(invSummary?.outOfStockCount ?? 0, 0);
  const healthyPct =
    totalProducts > 0 ? Math.round((inStock / totalProducts) * 100) : 100;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Quick Actions */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SalesOrderForm')}
          >
            <View style={styles.quickIconBox}>
              <ShoppingCart size={17} color={colors.primary} />
            </View>
            <Text style={styles.quickLabel}>New Sale</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('StockEntryForm')}
          >
            <View style={styles.quickIconBox}>
              <PackagePlus size={17} color={colors.primary} />
            </View>
            <Text style={styles.quickLabel}>Add Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('PaymentQr')}
          >
            <View style={styles.quickIconBox}>
              <QrCode size={17} color={colors.primary} />
            </View>
            <Text style={styles.quickLabel}>Payment QR</Text>
          </TouchableOpacity>
        </View>

        {/* Financial Pulse */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.eyebrow}>FINANCIAL OVERVIEW</Text>
              <Text style={styles.cardTitle}>Revenue & Cashflow</Text>
            </View>

            <TouchableOpacity
              style={styles.pillBadge}
              onPress={() => navigateTab('ReceiveTab')}
              activeOpacity={0.75}
            >
              <Text style={styles.pillBadgeText}>
                {collectedPct}% Collected
              </Text>
              <ChevronRight size={13} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${collectedPct}%` }]} />
          </View>

          <View style={styles.grid2x2}>
            <TouchableOpacity
              style={styles.gridTile}
              activeOpacity={0.8}
              onPress={() => navigateTab('SalesTab', 'SalesOrders')}
            >
              <Text style={styles.tileLabel}>Total Sales</Text>
              <Text style={styles.tileVal}>{fmtMoney(totalSales)}</Text>
              <Text style={styles.tileSub}>
                {overview?.totalOrders ?? 0} Orders
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridTile}
              activeOpacity={0.8}
              onPress={() => navigateTab('ReceiveTab')}
            >
              <Text style={styles.tileLabel}>Received</Text>
              <Text style={styles.tileVal}>{fmtMoney(totalReceived)}</Text>
              <Text style={styles.tileSub}>
                Paid: {overview?.paidOrdersCount ?? 0} Orders
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridTile}
              activeOpacity={0.8}
              onPress={() => navigateTab('ReceiveTab')}
            >
              <Text style={styles.tileLabel}>Pending Balance</Text>
              <Text style={styles.tileVal}>{fmtMoney(totalReceivable)}</Text>
              <Text style={styles.tileSub}>
                {outstandingData?.pendingCustomersCount ?? 0} Customers
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridTile}
              activeOpacity={0.8}
              onPress={() => navigateTab('SalesTab', 'Suppliers')}
            >
              <Text style={styles.tileLabel}>Net Cashflow</Text>
              <Text style={styles.tileVal}>
                {netCashflow < 0
                  ? `-₹${Math.abs(netCashflow).toLocaleString('en-IN')}`
                  : fmtMoney(netCashflow)}
              </Text>
              <Text style={styles.tileSub}>
                Purchases: {fmtMoney(totalPurchases)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Inventory Health */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.eyebrow}>INVENTORY HEALTH</Text>
              <Text style={styles.cardTitle}>Warehouse Stock</Text>
            </View>

            <TouchableOpacity
              style={styles.pillBadge}
              onPress={() => navigateTab('StockTab', 'AllStock')}
              activeOpacity={0.75}
            >
              <Text style={styles.pillBadgeText}>{healthyPct}% Healthy</Text>
              <ChevronRight size={13} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${healthyPct}%` }]} />
          </View>

          <View style={styles.metricsRow}>
            <TouchableOpacity
              style={styles.metricTile}
              activeOpacity={0.8}
              onPress={() => navigateTab('StockTab', 'AllStock')}
            >
              <View style={styles.metricLabelRow}>
                <Boxes size={13} color={colors.primary} />
                <Text style={styles.metricLabel}>Total Units</Text>
              </View>
              <Text style={styles.metricVal} numberOfLines={1}>
                {Number(invSummary?.totalStockQuantity || 0).toLocaleString(
                  'en-IN',
                )}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.metricTile}
              activeOpacity={0.8}
              onPress={() => navigateTab('StockTab', 'AllStock')}
            >
              <View style={styles.metricLabelRow}>
                <Layers size={13} color={colors.primary} />
                <Text style={styles.metricLabel}>Products</Text>
              </View>
              <Text style={styles.metricVal}>{totalProducts}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.metricTile}
              activeOpacity={0.8}
              onPress={() => navigateTab('StockTab', 'AllStock')}
            >
              <View style={styles.metricLabelRow}>
                <FolderKanban size={13} color={colors.primary} />
                <Text style={styles.metricLabel}>Categories</Text>
              </View>
              <Text style={styles.metricVal}>
                {invSummary?.totalCategories ?? 0}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statusRow}>
            <TouchableOpacity
              style={styles.statusChip}
              activeOpacity={0.75}
              onPress={() => navigateTab('StockTab', 'AllStock')}
            >
              <View style={[styles.dot, styles.greenDot]} />
              <Text style={styles.statusText}>In: {inStock}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statusChip}
              activeOpacity={0.75}
              onPress={() => navigateTab('StockTab', 'LowStock')}
            >
              <View style={[styles.dot, styles.amberDot]} />
              <Text style={styles.statusText}>Low: {lowStock}</Text>
              <ChevronRight size={12} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statusChip}
              activeOpacity={0.75}
              onPress={() => navigateTab('StockTab', 'LowStock')}
            >
              <View style={[styles.dot, styles.redDot]} />
              <Text style={styles.statusText}>Out: {outStock}</Text>
              <ChevronRight size={12} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Top Pending Customer Payments */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.eyebrow}>RECEIVABLES</Text>
              <Text style={styles.cardTitle}>Top Pending Customers</Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => navigateTab('ReceiveTab')}
              activeOpacity={0.75}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {topPendingCustomers.length === 0 ? (
            <Text style={styles.emptyText}>
              All customer payments are settled.
            </Text>
          ) : (
            topPendingCustomers.map((cust, idx) => (
              <TouchableOpacity
                key={cust.customerId || `${cust.customerName}-${idx}`}
                style={[styles.listRow, idx > 0 && styles.listRowBorder]}
                activeOpacity={0.75}
                onPress={() =>
                  navigation.navigate('CustomerPendingDetail', {
                    customer: cust,
                  })
                }
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {getInitials(cust.customerName)}
                  </Text>
                </View>

                <View style={styles.listMeta}>
                  <Text style={styles.listTitle} numberOfLines={1}>
                    {cust.customerName}
                  </Text>
                  <Text style={styles.listSub}>
                    {cust.pendingOrdersCount}{' '}
                    {cust.pendingOrdersCount === 1 ? 'Invoice' : 'Invoices'} •{' '}
                    {cust.ageingDays === 0 ? 'Today' : `${cust.ageingDays}d`}
                  </Text>
                </View>

                <View style={styles.listRight}>
                  <Text style={styles.listAmount}>
                    {fmtMoney(cust.outstanding)}
                  </Text>
                  <ChevronRight size={14} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Critical Stock Alerts */}
        {lowStockItems.length > 0 ? (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.eyebrow}>RESTOCK NEEDED</Text>
                <Text style={styles.cardTitle}>Low Stock Alerts</Text>
              </View>
              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={() => navigateTab('StockTab', 'LowStock')}
                activeOpacity={0.75}
              >
                <Text style={styles.viewAllText}>All Alerts</Text>
                <ChevronRight size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {lowStockItems.map((item, idx) => (
              <TouchableOpacity
                key={item.productId}
                style={[styles.listRow, idx > 0 && styles.listRowBorder]}
                activeOpacity={0.75}
                onPress={() =>
                  navigation.navigate('ProductDetail', {
                    productId: item.productId,
                  })
                }
              >
                <View style={styles.listMeta}>
                  <Text style={styles.listTitle} numberOfLines={1}>
                    {item.productName}
                  </Text>
                  <Text style={styles.listSub}>
                    {item.productCode} • Remaining: {item.currentStock}{' '}
                    {item.unit}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.restockBtn}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate('StockEntryForm', {
                      productId: item.productId,
                      productName: item.productName,
                      currentStock: item.currentStock,
                      unit: item.unit,
                    })
                  }
                >
                  <Plus size={12} color={colors.primary} />
                  <Text style={styles.restockText}>Restock</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* Recent Sales Orders */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.eyebrow}>LATEST ACTIVITY</Text>
              <Text style={styles.cardTitle}>Recent Sales Orders</Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => navigateTab('SalesTab', 'SalesOrders')}
              activeOpacity={0.75}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 ? (
            <Text style={styles.emptyText}>No sales orders yet.</Text>
          ) : (
            recentOrders.map((order, idx) => {
              const dotStyle =
                order.paymentStatus === 'PAID'
                  ? styles.greenDot
                  : order.paymentStatus === 'PARTIAL'
                    ? styles.amberDot
                    : styles.redDot;

              return (
                <TouchableOpacity
                  key={order._id}
                  style={[styles.listRow, idx > 0 && styles.listRowBorder]}
                  activeOpacity={0.75}
                  onPress={() =>
                    navigation.navigate('SalesOrderDetail', {
                      orderId: order._id,
                    })
                  }
                >
                  <View style={styles.listMeta}>
                    <View style={styles.orderTitleRow}>
                      <Text style={styles.listTitle}>{order.orderNumber}</Text>
                      <View style={styles.miniStatusChip}>
                        <View style={[styles.dot, dotStyle]} />
                        <Text style={styles.miniStatusText}>
                          {order.paymentStatus}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.listSub} numberOfLines={1}>
                      {order.customerSnapshot?.name || 'Walk-in'} •{' '}
                      {formatDate(order.orderDate)}
                    </Text>
                  </View>

                  <View style={styles.listRight}>
                    <Text style={styles.listAmount}>
                      {fmtMoney(order.grandTotal)}
                    </Text>
                    <ChevronRight size={14} color={colors.textMuted} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    ...shadows.card,
  },
  quickIconBox: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 0.7,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 1,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  barTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfacePressed,
    overflow: 'hidden',
    marginTop: spacing.sm + 2,
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginTop: spacing.sm + 2,
  },
  gridTile: {
    width: '48.5%',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.sm + 2,
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  tileVal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 4,
  },
  tileSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginTop: spacing.sm + 2,
  },
  metricTile: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  metricVal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginTop: spacing.sm + 2,
  },
  statusChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
  },
  greenDot: {
    backgroundColor: colors.success,
  },
  amberDot: {
    backgroundColor: colors.warning,
  },
  redDot: {
    backgroundColor: colors.danger,
  },
  statusText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
  },
  listRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
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
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  listMeta: {
    flex: 1,
  },
  listTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  listSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  listRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listAmount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  restockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  restockText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  orderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  miniStatusText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    paddingVertical: spacing.sm,
  },
});
