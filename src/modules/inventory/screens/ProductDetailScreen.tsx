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
import { Package, Pencil, Plus } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { API_ORIGIN } from '../../../core/api';
import type { RootStackParamList } from '../../../core/navigation/types';
import { IosLoader } from '../../../core/components/IosLoader';
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
  ProductStockChart,
  StockEntryHistoryCard,
} from '../components';
import { useProductDetail, useProductStockEntries } from '../hooks';
import type { ProductImageItem } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;
type HistoryTab = 'ALL' | 'SELF_MADE' | 'PURCHASED';

function resolveAllImages(images: ProductImageItem[] = []): string[] {
  return images
    .map((img) => {
      const raw = typeof img === 'string' ? img : img?.url;
      if (!raw) return null;
      return raw.startsWith('http') ? raw : `${API_ORIGIN}${raw}`;
    })
    .filter((u): u is string => Boolean(u));
}

export function ProductDetailScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const [activeTab, setActiveTab] = useState<HistoryTab>('ALL');

  const { data: product, isLoading } = useProductDetail(productId);
  const { data: entries = [], isLoading: isLoadingEntries } =
    useProductStockEntries(productId);

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
    return (
      <View style={styles.centerBox}>
        <IosLoader size={28} color={colors.primary} />
      </View>
    );
  }

  const imageList = resolveAllImages(product.images);
  const unit = product.unit || 'PCS';

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
            <View style={styles.stockPill}>
              <Text style={styles.stockPillText}>
                {product.currentStock} {unit}
              </Text>
            </View>
          </View>
        </View>

        {/* Month-wise & Year-wise Added vs Sold Chart */}
        <ProductStockChart productId={product.id} unit={unit} />

        {/* Tabs: All | In-House | Purchased */}
        <View style={styles.section}>
          <View style={styles.tabsRow}>
            {(
              [
                { key: 'ALL', label: 'All' },
                { key: 'SELF_MADE', label: 'In-House' },
                { key: 'PURCHASED', label: 'Purchased' },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabBtn, active && styles.tabBtnActive]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text
                    style={[styles.tabText, active && styles.tabTextActive]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {isLoadingEntries ? (
            <View style={styles.loaderInline}>
              <IosLoader size={22} color={colors.primary} />
            </View>
          ) : filteredEntries.length === 0 ? (
            <Text style={styles.emptyText}>
              No stock entries found in this tab.
            </Text>
          ) : (
            filteredEntries.map((entry) => (
              <StockEntryHistoryCard
                key={entry.id}
                entry={entry}
                productId={product.id}
                unit={unit}
              />
            ))
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
      </View>
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
  stockPill: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.successBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  stockPillText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
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
  },
  addBtn: {
    minHeight: touchTarget.minHeight,
    flexDirection: 'row',
    gap: spacing.sm,
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
});
