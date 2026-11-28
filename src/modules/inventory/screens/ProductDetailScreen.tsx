import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Boxes,
  ChevronRight,
  Factory,
  FileText,
  IndianRupee,
  Package,
  Pencil,
  Phone,
  Plus,
  Receipt,
  ShieldAlert,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getApiOrigin } from '../../../core/api';
import type { RootStackParamList } from '../../../core/navigation/types';
import {
  colors,
  commonStyles,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
  touchTarget,
} from '../../../core/theme';
import {
  DamageProductModal,
  ProductStockChart,
  StockEntryHistoryCard,
} from '../components';
import {
  HistoryRowsSkeleton,
  ProductDetailSkeleton,
} from '../skeletons';
import {
  useProductDamageReports,
  useProductDetail,
  useProductStockEntries,
} from '../hooks';
import type { ProductImageItem } from '../types';
import { useProductExpenses } from '../../financial/hooks';
import { useInfiniteSalesOrders } from '../../orders/hooks';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;
type HistoryTab = 'ALL' | 'SELF_MADE' | 'PURCHASED' | 'SALES' | 'DAMAGED';

function fmtMoney(val?: number): string {
  return `₹${Math.round(Number(val || 0)).toLocaleString('en-IN')}`;
}

function fmtNum(val?: number): string {
  return Number(val || 0).toLocaleString('en-IN');
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

function resolveAllImages(images: ProductImageItem[] = []): string[] {
  const origin = getApiOrigin();
  return images
    .map((img) => {
      const raw = typeof img === 'string' ? img : img?.url;
      if (!raw) return null;
      return raw.startsWith('http') ? raw : `${origin}${raw}`;
    })
    .filter((u): u is string => Boolean(u));
}

export function ProductDetailScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const [activeTab, setActiveTab] = useState<HistoryTab>('ALL');
  const [damageModalOpen, setDamageModalOpen] = useState(false);

  const { data: product, isLoading } = useProductDetail(productId);
  const { data: entries = [], isLoading: isLoadingEntries } =
    useProductStockEntries(productId);
  const { data: damageReports = [], isLoading: isLoadingDamage } =
    useProductDamageReports(productId);
  const { data: productExpenses = [] } = useProductExpenses(productId);
  const { data: salesPages, isLoading: isLoadingSales } =
    useInfiniteSalesOrders(undefined, productId);

  const salesOrders = useMemo(
    () => salesPages?.pages.flatMap((page) => page.items) ?? [],
    [salesPages],
  );

  const renderEditButton = useCallback(
    () => (
      <TouchableOpacity
        style={styles.headerEditBtn}
        onPress={() => navigation.navigate('ProductForm', { productId })}
        activeOpacity={0.75}
      >
        <Pencil size={14} color={colors.primary} />
        <Text style={styles.headerEditText}>Edit</Text>
      </TouchableOpacity>
    ),
    [navigation, productId],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: renderEditButton,
    });
  }, [navigation, renderEditButton]);

  const pid = String(product?.id || productId);

  const inHouseEntries = useMemo(
    () => entries.filter((e) => (e.sourceType ?? 'SELF_MADE') === 'SELF_MADE'),
    [entries],
  );

  const purchasedEntries = useMemo(
    () => entries.filter((e) => e.sourceType === 'PURCHASED'),
    [entries],
  );

  // In-House Production Analytics
  const inHouseStats = useMemo(() => {
    let totalUnits = 0;
    for (const e of inHouseEntries) {
      const line = e.items.find((i) => String(i.product) === pid);
      totalUnits += Number(line?.quantity || 0);
    }
    let totalProductionCost = 0;
    const lineBreakdown = new Map<string, number>();
    for (const exp of productExpenses) {
      totalProductionCost += Number(exp.totalAmount || 0);
      for (const li of exp.lineItems ?? []) {
        const key = String(li.key || 'Other').trim();
        lineBreakdown.set(
          key,
          (lineBreakdown.get(key) || 0) + Number(li.amount || 0),
        );
      }
    }
    const breakdownList = [...lineBreakdown.entries()]
      .map(([key, amount]) => ({ key, amount }))
      .sort((a, b) => b.amount - a.amount);

    return {
      batchCount: inHouseEntries.length,
      totalUnits,
      totalProductionCost,
      expenseCount: productExpenses.length,
      avgUnitCost: totalUnits > 0 ? totalProductionCost / totalUnits : 0,
      breakdownList,
    };
  }, [inHouseEntries, productExpenses, pid]);

  // Purchased & Supplier Analytics
  const purchaseStats = useMemo(() => {
    let totalUnits = 0;
    let totalSpend = 0;
    let materialCost = 0;
    let transportCost = 0;
    let otherCost = 0;

    const supplierMap = new Map<
      string,
      {
        name: string;
        phone: string;
        billCount: number;
        totalUnits: number;
        totalSpend: number;
      }
    >();

    for (const e of purchasedEntries) {
      const line = e.items.find((i) => String(i.product) === pid);
      const qty =
        Number(line?.quantity || 0) ||
        Number(e.readymadeData?.totalUnits || 0) ||
        Number(e.rawData?.totalUnits || 0);
      const cost = Number(e.totalPurchaseCost ?? e.totalAmount ?? 0);
      const trans = Number(e.transportCost || 0);
      const oth = Number(e.otherCost || 0);
      const mat = Math.max(0, cost - trans - oth);

      totalUnits += qty;
      totalSpend += cost;
      materialCost += mat;
      transportCost += trans;
      otherCost += oth;

      const supName = String(e.supplierName || '').trim() || 'Direct Purchase';
      const supKey = supName.toLowerCase();
      const existing = supplierMap.get(supKey) || {
        name: supName,
        phone: String(e.supplierPhone || ''),
        billCount: 0,
        totalUnits: 0,
        totalSpend: 0,
      };
      existing.billCount += 1;
      existing.totalUnits += qty;
      existing.totalSpend += cost;
      if (!existing.phone && e.supplierPhone) {
        existing.phone = String(e.supplierPhone);
      }
      supplierMap.set(supKey, existing);
    }

    const suppliers = [...supplierMap.values()].sort(
      (a, b) => b.totalSpend - a.totalSpend,
    );

    return {
      billCount: purchasedEntries.length,
      supplierCount: suppliers.length,
      suppliers,
      totalUnits,
      totalSpend,
      materialCost,
      transportCost,
      otherCost,
      avgUnitCost: totalUnits > 0 ? totalSpend / totalUnits : 0,
    };
  }, [purchasedEntries, pid]);

  // Sales & Balance Analytics
  const salesStats = useMemo(() => {
    let totalUnitsSold = 0;
    let totalRevenue = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let activeOrderCount = 0;
    const customerSet = new Set<string>();

    for (const order of salesOrders) {
      if (order.fulfillmentStatus === 'CANCELLED') continue;
      const soldLine = order.items.find((i) => String(i.product) === pid);
      if (!soldLine) continue;

      activeOrderCount += 1;
      const qty = Number(soldLine.orderedQuantity || 0);
      const lineTotal = Number(soldLine.lineTotal || 0);
      totalUnitsSold += qty;
      totalRevenue += lineTotal;

      const orderTotal = Number(order.grandTotal || 0);
      const orderPaid = Number(order.advancePaid || 0);
      const ratio = orderTotal > 0 ? Math.min(1, lineTotal / orderTotal) : 0;
      const linePaid = Math.min(lineTotal, orderPaid * ratio);
      const lineDue = Math.max(0, lineTotal - linePaid);
      totalPaid += linePaid;
      totalDue += lineDue;

      const custKey =
        order.customerSnapshot?.phone ||
        order.customerSnapshot?.name ||
        order._id;
      customerSet.add(String(custKey).toLowerCase());
    }

    const collectedPct =
      totalRevenue > 0
        ? Math.min(100, Math.round((totalPaid / totalRevenue) * 100))
        : 0;

    return {
      orderCount: activeOrderCount,
      customerCount: customerSet.size,
      totalUnitsSold,
      totalRevenue,
      totalPaid,
      totalDue,
      collectedPct,
      avgSellingPrice:
        totalUnitsSold > 0
          ? totalRevenue / totalUnitsSold
          : Number(product?.defaultSellingPrice || 0),
    };
  }, [salesOrders, pid, product?.defaultSellingPrice]);

  // Damage Analytics
  const damageStats = useMemo(() => {
    let totalUnits = 0;
    let totalLoss = 0;
    for (const rep of damageReports) {
      const dmgLine = rep.items.find((i) => String(i.product) === pid);
      totalUnits += Number(dmgLine?.quantity ?? rep.totalQuantity ?? 0);
      totalLoss += Number(
        dmgLine?.estimatedLoss ?? rep.totalEstimatedLoss ?? 0,
      );
    }
    return {
      incidentCount: damageReports.length,
      totalUnits: Math.max(totalUnits, Number(product?.damagedQuantity || 0)),
      totalLoss,
    };
  }, [damageReports, pid, product?.damagedQuantity]);

  if (isLoading || !product) {
    return <ProductDetailSkeleton />;
  }

  const imageList = resolveAllImages(product.images);
  const unit = product.unit || 'PCS';
  const availStock = Number(product.availableStock ?? product.currentStock ?? 0);
  const lowThreshold = Number(product.lowStockThreshold ?? 10);
  const sellingPrice = Number(product.defaultSellingPrice || 0);
  const effectiveUnitCost =
    Number(product.purchaseCost || 0) ||
    purchaseStats.avgUnitCost ||
    inHouseStats.avgUnitCost ||
    0;
  const stockAssetValue = availStock * (effectiveUnitCost || sellingPrice);
  const marginPct =
    sellingPrice > 0 && effectiveUnitCost > 0
      ? Math.round(((sellingPrice - effectiveUnitCost) / sellingPrice) * 100)
      : null;
  const estSalesProfit =
    effectiveUnitCost > 0 && salesStats.totalUnitsSold > 0
      ? Math.round(
          salesStats.totalRevenue -
            salesStats.totalUnitsSold * effectiveUnitCost,
        )
      : null;

  const stockBadge =
    availStock <= 0
      ? {
          label: 'Out of Stock',
          bg: colors.dangerBg,
          border: colors.dangerBorder,
          color: colors.danger,
        }
      : availStock <= lowThreshold
        ? {
            label: 'Low Stock',
            bg: colors.warningBg,
            border: colors.warningBorder,
            color: colors.warning,
          }
        : {
            label: 'In Stock',
            bg: colors.successBg,
            border: colors.successBorder,
            color: colors.success,
          };

  const tabs: Array<{ key: HistoryTab; label: string; count?: number }> = [
    { key: 'ALL', label: 'Overview' },
    { key: 'SELF_MADE', label: 'In-House', count: inHouseStats.batchCount },
    { key: 'PURCHASED', label: 'Purchased', count: purchaseStats.billCount },
    { key: 'SALES', label: 'Sales', count: salesStats.orderCount },
    { key: 'DAMAGED', label: 'Damaged', count: damageStats.incidentCount },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      {/* Top Tab Bar */}
      <View style={styles.topTabBarWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabBtn}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.75}
              >
                <View style={styles.tabLabelRow}>
                  <Text
                    style={[styles.tabText, active && styles.tabTextActive]}
                  >
                    {tab.label}
                  </Text>
                  {typeof tab.count === 'number' && tab.count > 0 ? (
                    <View
                      style={[
                        styles.tabCountBadge,
                        active && styles.tabCountBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabCountText,
                          active && styles.tabCountTextActive,
                        ]}
                      >
                        {tab.count}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {active ? <View style={styles.tabIndicator} /> : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'ALL' ? (
          <>
            {/* Image Gallery */}
            {imageList.length > 0 ? (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryRow}
              >
                {imageList.map((uri, idx) => (
                  <Image
                    key={`${uri}-${idx}`}
                    source={{ uri }}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.placeholderHero}>
                <Package size={44} color={colors.primary} />
              </View>
            )}

            {/* Executive Product Hero Card */}
            <View style={styles.sectionPad}>
              <View style={styles.heroCard}>
                <View style={styles.heroBadgesRow}>
                  <View style={styles.codePill}>
                    <Text style={styles.codePillText}>
                      {product.productCode}
                    </Text>
                  </View>
                  <View style={styles.catPill}>
                    <Text style={styles.catPillText}>
                      {product.category || 'General'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.stockStatusPill,
                      {
                        backgroundColor: stockBadge.bg,
                        borderColor: stockBadge.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: stockBadge.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.stockStatusText,
                        { color: stockBadge.color },
                      ]}
                    >
                      {stockBadge.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.productTitle}>{product.name}</Text>
                {product.description ? (
                  <Text style={styles.productDesc}>{product.description}</Text>
                ) : null}

                {/* 2x2 Business Owner KPI Grid */}
                <View style={styles.kpiGrid}>
                  <View style={styles.kpiTile}>
                    <View style={styles.kpiIconRow}>
                      <Boxes size={14} color={colors.primary} />
                      <Text style={styles.kpiLabel}>Available Stock</Text>
                    </View>
                    <Text style={styles.kpiVal} numberOfLines={1}>
                      {fmtNum(availStock)} {unit}
                    </Text>
                    <Text style={styles.kpiSub} numberOfLines={1}>
                      Min alert: {lowThreshold} {unit}
                    </Text>
                  </View>

                  <View style={styles.kpiTile}>
                    <View style={styles.kpiIconRow}>
                      <Package size={14} color={colors.primary} />
                      <Text style={styles.kpiLabel}>Stock Value</Text>
                    </View>
                    <Text style={styles.kpiVal} numberOfLines={1}>
                      {fmtMoney(stockAssetValue)}
                    </Text>
                    <Text style={styles.kpiSub} numberOfLines={1}>
                      Current inventory asset
                    </Text>
                  </View>

                  <View style={styles.kpiTile}>
                    <View style={styles.kpiIconRow}>
                      <IndianRupee size={14} color={colors.primary} />
                      <Text style={styles.kpiLabel}>Selling Price</Text>
                    </View>
                    <Text style={styles.kpiVal} numberOfLines={1}>
                      {sellingPrice > 0 ? `${fmtMoney(sellingPrice)}/${unit}` : '—'}
                    </Text>
                    <Text style={styles.kpiSub} numberOfLines={1}>
                      {marginPct !== null
                        ? `Cost ${fmtMoney(effectiveUnitCost)} · ${marginPct}% margin`
                        : effectiveUnitCost > 0
                          ? `Avg cost ${fmtMoney(effectiveUnitCost)}`
                          : 'Price per unit'}
                    </Text>
                  </View>

                  <View style={styles.kpiTile}>
                    <View style={styles.kpiIconRow}>
                      <TrendingUp size={14} color={colors.success} />
                      <Text style={styles.kpiLabel}>Sales Revenue</Text>
                    </View>
                    <Text
                      style={[styles.kpiVal, styles.greenText]}
                      numberOfLines={1}
                    >
                      {fmtMoney(salesStats.totalRevenue)}
                    </Text>
                    <Text style={styles.kpiSub} numberOfLines={1}>
                      {fmtNum(salesStats.totalUnitsSold)} {unit} sold
                    </Text>
                  </View>
                </View>

                {/* Lifecycle Flow Strip */}
                <View style={styles.lifecycleStrip}>
                  <View style={styles.lifecycleCol}>
                    <Text style={styles.lifecycleLabel}>Total Added</Text>
                    <Text style={styles.lifecycleVal}>
                      {fmtNum(
                        inHouseStats.totalUnits + purchaseStats.totalUnits,
                      )}{' '}
                      {unit}
                    </Text>
                  </View>
                  <View style={styles.lifecycleDivider} />
                  <View style={styles.lifecycleCol}>
                    <Text style={styles.lifecycleLabel}>Total Sold</Text>
                    <Text style={[styles.lifecycleVal, styles.greenText]}>
                      {fmtNum(salesStats.totalUnitsSold)} {unit}
                    </Text>
                  </View>
                  <View style={styles.lifecycleDivider} />
                  <View style={styles.lifecycleCol}>
                    <Text style={styles.lifecycleLabel}>Damaged</Text>
                    <Text
                      style={[
                        styles.lifecycleVal,
                        damageStats.totalUnits > 0 ? styles.dangerText : null,
                      ]}
                    >
                      {fmtNum(damageStats.totalUnits)} {unit}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Month-wise & Year-wise Added vs Sold Chart */}
            <ProductStockChart productId={product.id} unit={unit} />

            {/* Recent Stock Activity */}
            <View style={styles.sectionPad}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionEyebrow}>RECENT STOCK ENTRIES</Text>
                <Text style={styles.sectionCount}>{entries.length} total</Text>
              </View>
              {isLoadingEntries ? (
                <HistoryRowsSkeleton />
              ) : entries.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    No stock entries recorded yet.
                  </Text>
                </View>
              ) : (
                entries.slice(0, 10).map((entry) => (
                  <StockEntryHistoryCard
                    key={entry.id}
                    entry={entry}
                    productId={product.id}
                    unit={unit}
                  />
                ))
              )}
            </View>
          </>
        ) : (
          <>
            {/* Compact Product Context Strip on Sub-tabs */}
            <View style={styles.compactHeaderCard}>
              <View style={styles.compactHeaderLeft}>
                <Text style={styles.compactTitle} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={styles.compactSub} numberOfLines={1}>
                  {product.productCode} • {product.category || 'General'}
                </Text>
              </View>
              <View
                style={[
                  styles.stockStatusPill,
                  {
                    backgroundColor: stockBadge.bg,
                    borderColor: stockBadge.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: stockBadge.color },
                  ]}
                />
                <Text
                  style={[styles.stockStatusText, { color: stockBadge.color }]}
                >
                  {fmtNum(availStock)} {unit}
                </Text>
              </View>
            </View>

            {/* IN-HOUSE TAB */}
            {activeTab === 'SELF_MADE' ? (
              <View style={styles.sectionPad}>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryHeaderRow}>
                    <View style={styles.summaryIconBox}>
                      <Factory size={16} color={colors.primary} />
                    </View>
                    <View style={styles.summaryHeaderMeta}>
                      <Text style={styles.summaryEyebrow}>
                        IN-HOUSE PRODUCTION SUMMARY
                      </Text>
                      <Text style={styles.summaryHeroVal}>
                        {fmtNum(inHouseStats.totalUnits)} {unit} Produced
                      </Text>
                    </View>
                  </View>

                  <View style={styles.threeColStrip}>
                    <View style={styles.threeColCell}>
                      <Text style={styles.threeColLabel}>Prod. Cost</Text>
                      <Text style={styles.threeColVal} numberOfLines={1}>
                        {fmtMoney(inHouseStats.totalProductionCost)}
                      </Text>
                    </View>
                    <View style={styles.threeColDivider} />
                    <View style={styles.threeColCell}>
                      <Text style={styles.threeColLabel}>Avg / {unit}</Text>
                      <Text style={styles.threeColVal} numberOfLines={1}>
                        {inHouseStats.avgUnitCost > 0
                          ? fmtMoney(inHouseStats.avgUnitCost)
                          : '—'}
                      </Text>
                    </View>
                    <View style={styles.threeColDivider} />
                    <View style={styles.threeColCell}>
                      <Text style={styles.threeColLabel}>Batches</Text>
                      <Text style={styles.threeColVal} numberOfLines={1}>
                        {inHouseStats.batchCount}
                      </Text>
                    </View>
                  </View>

                  {inHouseStats.breakdownList.length > 0 ? (
                    <View style={styles.breakdownBox}>
                      <Text style={styles.breakdownHeading}>
                        COST BREAKDOWN
                      </Text>
                      {inHouseStats.breakdownList.map((b) => (
                        <View key={b.key} style={styles.breakdownRow}>
                          <Text style={styles.breakdownKey}>{b.key}</Text>
                          <Text style={styles.breakdownVal}>
                            {fmtMoney(b.amount)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>

                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionEyebrow}>PRODUCTION BATCHES</Text>
                  <Text style={styles.sectionCount}>
                    {inHouseEntries.length} entries
                  </Text>
                </View>
                {isLoadingEntries ? (
                  <HistoryRowsSkeleton />
                ) : inHouseEntries.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>
                      No in-house production stock entries yet.
                    </Text>
                  </View>
                ) : (
                  inHouseEntries.map((entry) => (
                    <StockEntryHistoryCard
                      key={entry.id}
                      entry={entry}
                      productId={product.id}
                      unit={unit}
                    />
                  ))
                )}

                {productExpenses.length > 0 ? (
                  <>
                    <View style={[styles.sectionHeaderRow, styles.mtMd]}>
                      <Text style={styles.sectionEyebrow}>
                        PRODUCTION EXPENSES
                      </Text>
                      <Text style={styles.sectionCount}>
                        {productExpenses.length} records
                      </Text>
                    </View>
                    {productExpenses.map((exp) => (
                      <View key={exp._id} style={styles.expenseCard}>
                        <View style={styles.expenseTopRow}>
                          <View style={styles.expenseNumWrap}>
                            <Receipt size={14} color={colors.primary} />
                            <Text style={styles.expenseNum}>
                              {exp.expenseNumber}
                            </Text>
                          </View>
                          <Text style={styles.expenseAmt}>
                            {fmtMoney(exp.totalAmount)}
                          </Text>
                        </View>
                        <Text style={styles.expenseDate}>
                          {formatDate(exp.expenseDate)}
                        </Text>
                        {exp.lineItems && exp.lineItems.length > 0 ? (
                          <View style={styles.expenseLines}>
                            {exp.lineItems.map((li, idx) => (
                              <View
                                key={`${exp._id}-li-${idx}`}
                                style={styles.breakdownRow}
                              >
                                <Text style={styles.expenseLineKey}>
                                  {li.key}
                                </Text>
                                <Text style={styles.expenseLineVal}>
                                  {fmtMoney(li.amount)}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ) : null}
                        {exp.notes ? (
                          <Text style={styles.expenseNotes}>{exp.notes}</Text>
                        ) : null}
                      </View>
                    ))}
                  </>
                ) : null}
              </View>
            ) : null}

            {/* PURCHASED TAB */}
            {activeTab === 'PURCHASED' ? (
              <View style={styles.sectionPad}>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryHeaderRow}>
                    <View style={styles.summaryIconBox}>
                      <ShoppingBag size={16} color={colors.primary} />
                    </View>
                    <View style={styles.summaryHeaderMeta}>
                      <Text style={styles.summaryEyebrow}>
                        PURCHASED SUMMARY
                      </Text>
                      <Text style={styles.summaryHeroVal}>
                        {fmtMoney(purchaseStats.totalSpend)}
                      </Text>
                    </View>
                    <View style={styles.metaPillBlue}>
                      <Text style={styles.metaPillBlueText}>
                        {purchaseStats.supplierCount}{' '}
                        {purchaseStats.supplierCount === 1
                          ? 'Supplier'
                          : 'Suppliers'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.subMetaPillsRow}>
                    <Text style={styles.subMetaChip}>
                      {fmtNum(purchaseStats.totalUnits)} {unit} Purchased
                    </Text>
                    <Text style={styles.subMetaChip}>
                      {purchaseStats.billCount}{' '}
                      {purchaseStats.billCount === 1 ? 'Bill' : 'Bills'}
                    </Text>
                    {purchaseStats.avgUnitCost > 0 ? (
                      <Text style={styles.subMetaChip}>
                        Avg {fmtMoney(purchaseStats.avgUnitCost)}/{unit}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.threeColStrip}>
                    <View style={styles.threeColCell}>
                      <Text style={styles.threeColLabel}>Material</Text>
                      <Text style={styles.threeColVal} numberOfLines={1}>
                        {fmtMoney(purchaseStats.materialCost)}
                      </Text>
                    </View>
                    <View style={styles.threeColDivider} />
                    <View style={styles.threeColCell}>
                      <Text style={styles.threeColLabel}>Transport</Text>
                      <Text style={styles.threeColVal} numberOfLines={1}>
                        {fmtMoney(purchaseStats.transportCost)}
                      </Text>
                    </View>
                    <View style={styles.threeColDivider} />
                    <View style={styles.threeColCell}>
                      <Text style={styles.threeColLabel}>Other</Text>
                      <Text style={styles.threeColVal} numberOfLines={1}>
                        {fmtMoney(purchaseStats.otherCost)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Suppliers Breakdown */}
                {purchaseStats.suppliers.length > 0 ? (
                  <>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionEyebrow}>
                        SUPPLIERS PURCHASED FROM
                      </Text>
                      <Text style={styles.sectionCount}>
                        {purchaseStats.supplierCount} total
                      </Text>
                    </View>
                    {purchaseStats.suppliers.map((sup) => (
                      <View key={sup.name} style={styles.supplierRowCard}>
                        <View style={styles.supplierIconCircle}>
                          <Truck size={16} color={colors.primary} />
                        </View>
                        <View style={styles.supplierInfo}>
                          <Text style={styles.supplierName} numberOfLines={1}>
                            {sup.name}
                          </Text>
                          <Text style={styles.supplierSub}>
                            {sup.billCount}{' '}
                            {sup.billCount === 1 ? 'bill' : 'bills'} •{' '}
                            {fmtNum(sup.totalUnits)} {unit}
                          </Text>
                          {sup.phone ? (
                            <TouchableOpacity
                              style={styles.supPhoneRow}
                              onPress={() => Linking.openURL(`tel:${sup.phone}`)}
                              activeOpacity={0.75}
                            >
                              <Phone size={11} color={colors.primary} />
                              <Text style={styles.supPhoneText}>
                                {sup.phone}
                              </Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                        <Text style={styles.supplierSpend}>
                          {fmtMoney(sup.totalSpend)}
                        </Text>
                      </View>
                    ))}
                  </>
                ) : null}

                <View style={[styles.sectionHeaderRow, styles.mtMd]}>
                  <Text style={styles.sectionEyebrow}>PURCHASE BILLS</Text>
                  <Text style={styles.sectionCount}>
                    {purchasedEntries.length} entries
                  </Text>
                </View>
                {isLoadingEntries ? (
                  <HistoryRowsSkeleton />
                ) : purchasedEntries.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>
                      No purchased stock entries found for this product.
                    </Text>
                  </View>
                ) : (
                  purchasedEntries.map((entry) => (
                    <StockEntryHistoryCard
                      key={entry.id}
                      entry={entry}
                      productId={product.id}
                      unit={unit}
                      defaultExpanded
                    />
                  ))
                )}
              </View>
            ) : null}

            {/* SALES TAB */}
            {activeTab === 'SALES' ? (
              <View style={styles.sectionPad}>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryHeaderRow}>
                    <View style={styles.summaryIconBox}>
                      <TrendingUp size={16} color={colors.primary} />
                    </View>
                    <View style={styles.summaryHeaderMeta}>
                      <Text style={styles.summaryEyebrow}>
                        PRODUCT SALES SUMMARY
                      </Text>
                      <Text style={styles.summaryHeroVal}>
                        {fmtMoney(salesStats.totalRevenue)}
                      </Text>
                    </View>
                    <View style={styles.metaPillBlue}>
                      <Text style={styles.metaPillBlueText}>
                        {fmtNum(salesStats.totalUnitsSold)} {unit} Sold
                      </Text>
                    </View>
                  </View>

                  <View style={styles.subMetaPillsRow}>
                    <Text style={styles.subMetaChip}>
                      {salesStats.orderCount}{' '}
                      {salesStats.orderCount === 1 ? 'Order' : 'Orders'}
                    </Text>
                    <Text style={styles.subMetaChip}>
                      {salesStats.customerCount}{' '}
                      {salesStats.customerCount === 1
                        ? 'Customer'
                        : 'Customers'}
                    </Text>
                    <Text style={styles.subMetaChip}>
                      Avg {fmtMoney(salesStats.avgSellingPrice)}/{unit}
                    </Text>
                  </View>

                  {/* Collection Progress */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressLabelRow}>
                      <Text style={styles.progressLabel}>Payment Collected</Text>
                      <Text style={styles.progressPct}>
                        {salesStats.collectedPct}%
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${salesStats.collectedPct}%` },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.threeColStrip}>
                    <View style={styles.threeColCell}>
                      <Text style={styles.threeColLabel}>Received</Text>
                      <Text
                        style={[styles.threeColVal, styles.greenText]}
                        numberOfLines={1}
                      >
                        {fmtMoney(salesStats.totalPaid)}
                      </Text>
                    </View>
                    <View style={styles.threeColDivider} />
                    <View style={styles.threeColCell}>
                      <Text style={styles.threeColLabel}>Balance Due</Text>
                      <Text
                        style={[
                          styles.threeColVal,
                          salesStats.totalDue > 0 ? styles.dangerText : null,
                        ]}
                        numberOfLines={1}
                      >
                        {fmtMoney(salesStats.totalDue)}
                      </Text>
                    </View>
                    <View style={styles.threeColDivider} />
                    <View style={styles.threeColCell}>
                      <Text style={styles.threeColLabel}>Est. Profit</Text>
                      <Text
                        style={[
                          styles.threeColVal,
                          estSalesProfit !== null
                            ? estSalesProfit >= 0
                              ? styles.greenText
                              : styles.dangerText
                            : null,
                        ]}
                        numberOfLines={1}
                      >
                        {estSalesProfit !== null
                          ? fmtMoney(estSalesProfit)
                          : '—'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionEyebrow}>SALES ORDERS</Text>
                  <Text style={styles.sectionCount}>
                    {salesOrders.length} orders
                  </Text>
                </View>
                {isLoadingSales ? (
                  <HistoryRowsSkeleton />
                ) : salesOrders.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>
                      No sales orders found for this product.
                    </Text>
                  </View>
                ) : (
                  salesOrders.map((order) => {
                    const soldLine = order.items.find(
                      (i) => String(i.product) === pid,
                    );
                    const hasGst = Boolean(
                      order.includeGst && Number(order.tax || 0) > 0,
                    );
                    const orderTotal = Number(order.grandTotal || 0);
                    const orderPaid = Number(order.advancePaid || 0);
                    const orderDue = Math.max(0, orderTotal - orderPaid);
                    const isCancelled = order.fulfillmentStatus === 'CANCELLED';
                    const paidPct =
                      orderTotal > 0
                        ? Math.min(
                            100,
                            Math.round((orderPaid / orderTotal) * 100),
                          )
                        : 0;
                    const badge = isCancelled
                      ? {
                          label: 'Cancelled',
                          bg: colors.surfacePressed,
                          border: colors.border,
                          color: colors.textMuted,
                        }
                      : paidPct >= 100
                        ? {
                            label: 'Paid',
                            bg: colors.successBg,
                            border: colors.successBorder,
                            color: colors.success,
                          }
                        : paidPct > 0
                          ? {
                              label: `${paidPct}% Paid`,
                              bg: colors.warningBg,
                              border: colors.warningBorder,
                              color: colors.warning,
                            }
                          : {
                              label: 'Unpaid',
                              bg: colors.dangerBg,
                              border: colors.dangerBorder,
                              color: colors.danger,
                            };

                    return (
                      <TouchableOpacity
                        key={order._id}
                        style={styles.saleCard}
                        activeOpacity={0.8}
                        onPress={() =>
                          navigation.navigate('SalesOrderDetail', {
                            orderId: order._id,
                          })
                        }
                      >
                        <View
                          style={[
                            styles.cardAccentBar,
                            { backgroundColor: badge.color },
                          ]}
                        />
                        <View style={styles.saleCardInner}>
                          <View style={styles.saleTopRow}>
                            <View style={styles.saleNumRow}>
                              <FileText size={14} color={colors.primary} />
                              <Text style={styles.saleOrderNum}>
                                {order.orderNumber}
                              </Text>
                            </View>
                            <Text style={styles.saleDate}>
                              {formatDate(order.orderDate)}
                            </Text>
                          </View>

                          <View style={styles.saleBadgesRow}>
                            <View
                              style={[
                                styles.statusPill,
                                {
                                  backgroundColor: badge.bg,
                                  borderColor: badge.border,
                                },
                              ]}
                            >
                              <View
                                style={[
                                  styles.statusDot,
                                  { backgroundColor: badge.color },
                                ]}
                              />
                              <Text
                                style={[
                                  styles.statusPillText,
                                  { color: badge.color },
                                ]}
                              >
                                {badge.label}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.gstPill,
                                hasGst && styles.gstPillActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.gstPillText,
                                  hasGst && styles.gstPillTextActive,
                                ]}
                              >
                                {hasGst ? 'GST' : 'No GST'}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.saleCustRow}>
                            <Users size={12} color={colors.textMuted} />
                            <Text style={styles.saleCustomer} numberOfLines={1}>
                              {order.customerSnapshot?.name ||
                                'Walk-In Customer'}
                            </Text>
                          </View>

                          {soldLine ? (
                            <View style={styles.saleFooter}>
                              <View>
                                <Text style={styles.saleQtyText}>
                                  {fmtNum(soldLine.orderedQuantity)}{' '}
                                  {soldLine.unit} × {fmtMoney(soldLine.sellingPrice)}
                                </Text>
                                {!isCancelled && orderDue > 0 ? (
                                  <Text style={styles.saleDueSub}>
                                    Order Due: {fmtMoney(orderDue)}
                                  </Text>
                                ) : null}
                              </View>
                              <View style={styles.saleTotalRight}>
                                <Text style={styles.saleTotalText}>
                                  {fmtMoney(soldLine.lineTotal)}
                                </Text>
                                <ChevronRight
                                  size={15}
                                  color={colors.textMuted}
                                />
                              </View>
                            </View>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            ) : null}

            {/* DAMAGED TAB */}
            {activeTab === 'DAMAGED' ? (
              <View style={styles.sectionPad}>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryHeaderRow}>
                    <View style={styles.damageIconBox}>
                      <ShieldAlert size={16} color={colors.danger} />
                    </View>
                    <View style={styles.summaryHeaderMeta}>
                      <Text style={styles.summaryEyebrow}>
                        DAMAGED STOCK SUMMARY
                      </Text>
                      <Text style={[styles.summaryHeroVal, styles.dangerText]}>
                        -{fmtNum(damageStats.totalUnits)} {unit}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.threeColStrip}>
                    <View style={styles.threeColCell}>
                      <Text style={styles.threeColLabel}>Est. Loss</Text>
                      <Text
                        style={[styles.threeColVal, styles.dangerText]}
                        numberOfLines={1}
                      >
                        {fmtMoney(damageStats.totalLoss)}
                      </Text>
                    </View>
                    <View style={styles.threeColDivider} />
                    <View style={styles.threeColCell}>
                      <Text style={styles.threeColLabel}>Reports</Text>
                      <Text style={styles.threeColVal} numberOfLines={1}>
                        {damageStats.incidentCount}
                      </Text>
                    </View>
                    <View style={styles.threeColDivider} />
                    <View style={styles.threeColCell}>
                      <Text style={styles.threeColLabel}>Remaining</Text>
                      <Text style={styles.threeColVal} numberOfLines={1}>
                        {fmtNum(availStock)} {unit}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionEyebrow}>DAMAGE REPORTS</Text>
                  <Text style={styles.sectionCount}>
                    {damageReports.length} records
                  </Text>
                </View>
                {isLoadingDamage ? (
                  <HistoryRowsSkeleton />
                ) : damageReports.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>
                      No damaged stock recorded for this product.
                    </Text>
                  </View>
                ) : (
                  damageReports.map((rep) => {
                    const dmgLine = rep.items.find(
                      (i) => String(i.product) === pid,
                    );
                    const qty = dmgLine?.quantity ?? rep.totalQuantity ?? 0;
                    const loss =
                      dmgLine?.estimatedLoss ?? rep.totalEstimatedLoss ?? 0;
                    const ts = rep.approvedAt || rep.reportDate || rep.createdAt;
                    const dateTimeLabel = ts
                      ? new Date(ts).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—';
                    const reasonText = dmgLine?.reason || rep.notes || '';

                    return (
                      <View key={rep._id} style={styles.damageCard}>
                        <View
                          style={[
                            styles.cardAccentBar,
                            { backgroundColor: colors.danger },
                          ]}
                        />
                        <View style={styles.saleCardInner}>
                          <View style={styles.saleTopRow}>
                            <Text style={styles.saleOrderNum}>
                              {rep.damageNumber}
                            </Text>
                            <View style={styles.damageQtyBadge}>
                              <Text style={styles.damageQtyText}>
                                -{qty} {dmgLine?.unit || unit}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.saleDate}>{dateTimeLabel}</Text>
                          <View style={styles.damageBottomRow}>
                            <Text
                              style={styles.damageReasonText}
                              numberOfLines={2}
                            >
                              {reasonText || 'Damaged stock entry'}
                            </Text>
                            <Text style={styles.damageLossText}>
                              Loss {fmtMoney(loss)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* Bottom Sticky Action Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[commonStyles.primaryButton, styles.addBtn]}
          onPress={() =>
            navigation.navigate('StockEntryForm', {
              productId: product.id,
              productName: product.name,
              currentStock: product.currentStock,
              unit,
            })
          }
          activeOpacity={0.85}
        >
          <Plus size={18} color={colors.textInverse} />
          <Text style={commonStyles.primaryButtonText}>Add Stock</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.damageBtn}
          onPress={() => setDamageModalOpen(true)}
          activeOpacity={0.85}
        >
          <ShieldAlert size={17} color={colors.danger} />
          <Text style={styles.damageBtnText}>Damage</Text>
        </TouchableOpacity>
      </View>

      <DamageProductModal
        visible={damageModalOpen}
        productId={product.id}
        productName={product.name}
        availableStock={availStock}
        unit={unit}
        onClose={() => setDamageModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  headerEditText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  topTabBarWrap: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabsRow: {
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  tabBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  tabCountBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: radius.full,
    backgroundColor: colors.surfacePressed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCountBadgeActive: {
    backgroundColor: colors.primarySoft,
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  tabCountTextActive: {
    color: colors.primary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: spacing.sm,
    right: spacing.sm,
    height: 2.5,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  galleryRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  heroImage: {
    width: 280,
    height: 180,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSubtle,
  },
  placeholderHero: {
    height: 130,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionPad: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  mtMd: {
    marginTop: spacing.md,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md + 2,
    gap: spacing.sm + 4,
    ...shadows.card,
  },
  heroBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  codePill: {
    backgroundColor: colors.surfacePressed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  codePillText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  catPill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  catPillText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  stockStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    marginLeft: 'auto',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockStatusText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  productTitle: {
    fontSize: fontSize.lg + 1,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  productDesc: {
    fontSize: fontSize.xs + 1,
    color: colors.textSecondary,
    lineHeight: 19,
    marginTop: -4,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  kpiTile: {
    width: '48.4%',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.sm + 4,
    gap: 3,
  },
  kpiIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },
  kpiVal: {
    fontSize: fontSize.md + 1,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 10,
    color: colors.textMuted,
  },
  lifecycleStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.sm + 2,
  },
  lifecycleCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  lifecycleDivider: {
    width: 1,
    height: 26,
    backgroundColor: colors.border,
  },
  lifecycleLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  lifecycleVal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  compactHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  compactHeaderLeft: {
    flex: 1,
  },
  compactTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  compactSub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md + 2,
    gap: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  summaryIconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  damageIconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryHeaderMeta: {
    flex: 1,
  },
  summaryEyebrow: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 0.7,
  },
  summaryHeroVal: {
    fontSize: 22,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 1,
  },
  metaPillBlue: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  metaPillBlueText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  subMetaPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: -4,
  },
  subMetaChip: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    backgroundColor: colors.surfacePressed,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  threeColStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
  },
  threeColCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
  threeColDivider: {
    width: 1,
    height: 26,
    backgroundColor: colors.border,
  },
  threeColLabel: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },
  threeColVal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  breakdownBox: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.sm + 2,
    gap: 6,
  },
  breakdownHeading: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownKey: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  breakdownVal: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 0.7,
  },
  sectionCount: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  supplierRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm + 2,
  },
  supplierIconCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplierInfo: {
    flex: 1,
    gap: 2,
  },
  supplierName: {
    fontSize: fontSize.sm + 1,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  supplierSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  supPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  supPhoneText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  supplierSpend: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  expenseCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: 6,
  },
  expenseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseNumWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expenseNum: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  expenseAmt: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  expenseDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  expenseLines: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.sm,
    padding: spacing.sm,
    gap: 4,
    marginTop: 2,
  },
  expenseLineKey: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  expenseLineVal: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  expenseNotes: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  saleCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm + 2,
    overflow: 'hidden',
    ...shadows.card,
  },
  damageCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm + 2,
    overflow: 'hidden',
  },
  cardAccentBar: {
    width: 3.5,
  },
  saleCardInner: {
    flex: 1,
    padding: spacing.md,
    gap: 6,
  },
  saleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  saleNumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saleOrderNum: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  saleDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  saleBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  gstPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gstPillActive: {
    backgroundColor: colors.primarySoft,
    borderColor: '#BFDBFE',
  },
  gstPillText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  gstPillTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  saleCustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  saleCustomer: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.xs + 2,
    marginTop: 2,
  },
  saleQtyText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  saleDueSub: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.danger,
    marginTop: 2,
  },
  saleTotalRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  saleTotalText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  damageQtyBadge: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  damageQtyText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.danger,
  },
  damageBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.xs + 2,
  },
  damageReasonText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  damageLossText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.danger,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  greenText: {
    color: colors.success,
  },
  dangerText: {
    color: colors.danger,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addBtn: {
    flex: 1,
    minHeight: touchTarget.minHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  damageBtn: {
    minHeight: touchTarget.minHeight,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  damageBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.danger,
  },
});
