import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, Pencil, Plus, ShieldAlert } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getApiOrigin } from '../../../core/api';
import type { RootStackParamList } from '../../../core/navigation/types';
import {
  colors,
  commonStyles,
  fontSize,
  fontWeight,
  radius,
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

  const filteredEntries = useMemo(() => {
    if (activeTab === 'ALL') return entries;
    return entries.filter(
      (e) => (e.sourceType ?? 'SELF_MADE') === activeTab,
    );
  }, [entries, activeTab]);

  if (isLoading || !product) {
    return <ProductDetailSkeleton />;
  }

  const imageList = resolveAllImages(product.images);
  const unit = product.unit || 'PCS';

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      {/* Top Material-style Tab Bar */}
      <View style={styles.topTabBarWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {(
            [
              { key: 'ALL', label: 'All' },
              { key: 'SELF_MADE', label: 'In-House' },
              { key: 'PURCHASED', label: 'Purchased' },
              { key: 'SALES', label: 'Sales' },
              { key: 'DAMAGED', label: 'Damaged' },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabBtn}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.75}
              >
                <Text
                  style={[styles.tabText, active && styles.tabTextActive]}
                >
                  {tab.label}
                </Text>
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

            {/* Header Info */}
            <View style={styles.section}>
              <View style={styles.metaRow}>
                <Text style={styles.codeText}>{product.productCode}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>
                    {product.category || 'General'}
                  </Text>
                </View>
              </View>
              <View style={styles.titleStockRow}>
                <Text style={styles.title}>{product.name}</Text>
                <View style={styles.stockBadgesCol}>
                  <View style={styles.stockPill}>
                    <Text style={styles.stockPillText}>
                      Avail: {product.availableStock ?? product.currentStock}{' '}
                      {unit}
                    </Text>
                  </View>
                  {(product.damagedQuantity ?? 0) > 0 ? (
                    <View style={styles.damagedPill}>
                      <Text style={styles.damagedPillText}>
                        Damaged: {product.damagedQuantity} {unit}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Month-wise & Year-wise Added vs Sold Chart */}
            <ProductStockChart productId={product.id} unit={unit} />
          </>
        ) : (
          <View style={styles.compactHeaderCard}>
            <View style={styles.compactHeaderLeft}>
              <Text style={styles.compactTitle} numberOfLines={1}>
                {product.name}
              </Text>
              <Text style={styles.compactSub} numberOfLines={1}>
                {product.productCode} • {product.category || 'General'}
              </Text>
            </View>
            <View style={styles.stockBadgesCol}>
              <View style={styles.stockPill}>
                <Text style={styles.stockPillText}>
                  Avail: {product.availableStock ?? product.currentStock} {unit}
                </Text>
              </View>
              {(product.damagedQuantity ?? 0) > 0 ? (
                <View style={styles.damagedPill}>
                  <Text style={styles.damagedPillText}>
                    Damaged: {product.damagedQuantity} {unit}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* Tab Content */}
        <View style={styles.section}>

          {activeTab === 'DAMAGED' ? (
            isLoadingDamage ? (
              <HistoryRowsSkeleton />
            ) : damageReports.length === 0 ? (
              <Text style={styles.emptyText}>
                No damaged stock recorded for this product.
              </Text>
            ) : (
              damageReports.map((rep) => {
                const dmgLine = rep.items.find(
                  (i) => String(i.product) === String(product.id),
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
                    <Text style={styles.saleMeta}>{dateTimeLabel}</Text>
                    <View style={styles.saleBottomRow}>
                      <Text style={styles.saleQtyText} numberOfLines={2}>
                        {reasonText || 'Damaged stock entry'}
                      </Text>
                      <Text style={styles.damageLossText}>
                        Loss: ₹{Number(loss || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                );
              })
            )
          ) : activeTab === 'SALES' ? (
            isLoadingSales ? (
              <HistoryRowsSkeleton />
            ) : salesOrders.length === 0 ? (
              <Text style={styles.emptyText}>
                No sales orders found for this product.
              </Text>
            ) : (
              salesOrders.map((order) => {
                const soldLine = order.items.find(
                  (i) => String(i.product) === String(product.id),
                );
                const hasGst = Boolean(
                  order.includeGst && Number(order.tax || 0) > 0,
                );
                const dateLabel = order.orderDate
                  ? new Date(order.orderDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—';

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
                    <View style={styles.saleTopRow}>
                      <Text style={styles.saleOrderNum}>
                        {order.orderNumber}
                      </Text>
                      <View
                        style={[
                          styles.saleBadge,
                          hasGst ? styles.saleGstOn : styles.saleGstOff,
                        ]}
                      >
                        <Text
                          style={[
                            styles.saleBadgeText,
                            hasGst
                              ? styles.saleGstOnText
                              : styles.saleGstOffText,
                          ]}
                        >
                          {hasGst ? 'GST' : 'No GST'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.saleCustomer} numberOfLines={1}>
                      {order.customerSnapshot?.name || 'Walk-In Customer'}
                    </Text>
                    <Text style={styles.saleMeta}>
                      {order.customerSnapshot?.phone || 'No phone'} •{' '}
                      {dateLabel}
                    </Text>

                    {soldLine ? (
                      <View style={styles.saleBottomRow}>
                        <Text style={styles.saleQtyText}>
                          Qty: {soldLine.orderedQuantity} {soldLine.unit} × ₹
                          {soldLine.sellingPrice}
                        </Text>
                        <Text style={styles.saleTotalText}>
                          ₹
                          {Number(soldLine.lineTotal || 0).toLocaleString(
                            'en-IN',
                          )}
                        </Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })
            )
          ) : isLoadingEntries ? (
            <HistoryRowsSkeleton />
          ) : filteredEntries.length === 0 &&
            !(activeTab === 'SELF_MADE' && productExpenses.length > 0) ? (
            <Text style={styles.emptyText}>
              No stock entries found in this tab.
            </Text>
          ) : (
            <>
              {filteredEntries.map((entry) => (
                <StockEntryHistoryCard
                  key={entry.id}
                  entry={entry}
                  productId={product.id}
                  unit={unit}
                  defaultExpanded={activeTab === 'PURCHASED'}
                />
              ))}
              {activeTab === 'SELF_MADE' && productExpenses.length > 0 ? (
                <View style={styles.expensesSection}>
                  <Text style={styles.expensesHeading}>
                    In-House Production Expenses
                  </Text>
                  {productExpenses.map((exp) => (
                    <View key={exp._id} style={styles.expenseCard}>
                      <View style={styles.expenseTopRow}>
                        <Text style={styles.expenseNum}>
                          {exp.expenseNumber}
                        </Text>
                        <Text style={styles.expenseAmt}>
                          ₹{Number(exp.totalAmount || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                      {exp.lineItems && exp.lineItems.length > 0 ? (
                        <View style={styles.expenseLines}>
                          {exp.lineItems.map((li, idx) => (
                            <Text
                              key={`${exp._id}-li-${idx}`}
                              style={styles.expenseLineText}
                            >
                              • {li.key}: ₹
                              {Number(li.amount || 0).toLocaleString('en-IN')}
                            </Text>
                          ))}
                        </View>
                      ) : null}
                      {exp.notes ? (
                        <Text style={styles.expenseNotes}>{exp.notes}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

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
          <Text style={styles.damageBtnText}>Damage Product</Text>
        </TouchableOpacity>
      </View>

      <DamageProductModal
        visible={damageModalOpen}
        productId={product.id}
        productName={product.name}
        availableStock={product.availableStock ?? product.currentStock}
        unit={unit}
        onClose={() => setDamageModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  galleryRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  heroImage: {
    width: 240,
    height: 185,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  placeholderHero: {
    margin: spacing.lg,
    height: 150,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  codeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  categoryBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  categoryText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  titleStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  stockBadgesCol: {
    alignItems: 'flex-end',
    gap: 5,
  },
  stockPill: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  stockPillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  damagedPill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  damagedPillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  topTabBarWrap: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: spacing.sm,
  },
  tabBtn: {
    position: 'relative',
    paddingHorizontal: spacing.lg,
    paddingVertical: 15,
    minWidth: 76,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  tabIndicator: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: 0,
    height: 3.5,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  compactHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
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
    color: colors.textSecondary,
    marginTop: 2,
  },
  loaderInline: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.textMuted,
    paddingVertical: spacing.xl,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  addBtn: {
    minHeight: touchTarget.minHeight,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  damageBtn: {
    minHeight: touchTarget.minHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerBg,
  },
  damageBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.danger,
  },
  damageCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  damageQtyBadge: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  damageQtyText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.danger,
  },
  damageLossText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.danger,
  },
  headerEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  headerEditText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  saleCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  saleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  saleOrderNum: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  saleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  saleGstOn: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
  },
  saleGstOff: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
  },
  saleBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  saleGstOnText: {
    color: colors.success,
  },
  saleGstOffText: {
    color: colors.textSecondary,
  },
  saleCustomer: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  saleMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  saleBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  saleQtyText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  saleTotalText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  expensesSection: {
    marginTop: spacing.md,
    gap: spacing.xs + 2,
  },
  expensesHeading: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  expenseCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  expenseTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expenseNum: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  expenseAmt: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  expenseLines: {
    marginTop: 6,
    gap: 2,
  },
  expenseLineText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  expenseNotes: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 4,
  },
});
