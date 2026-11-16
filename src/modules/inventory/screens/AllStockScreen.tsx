import React, { useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  LayoutGrid,
  List,
  PackageOpen,
  Plus,
  Search,
  X,
} from 'lucide-react-native';
import { API_ORIGIN } from '../../../core/api';
import type { RootStackParamList } from '../../../core/navigation/types';
import { IosLoader } from '../../../core/components/IosLoader';
import { useDebounce } from '../../../core/hooks/useDebounce';
import { colors } from '../../../core/theme';
import {
  CategoryGridCard,
  StockItemCard,
  type CategorySummary,
} from '../components';
import { INVENTORY_COPY } from '../data';
import { useInfiniteInventoryList } from '../hooks';
import { inventoryStyles } from '../styles';
import type { InventoryItem, ProductImageItem } from '../types';

type ViewMode = 'list' | 'grid';

function getFirstImageUri(images: ProductImageItem[]): string | null {
  if (!images || images.length === 0) return null;
  const primary =
    images.find((img) => typeof img !== 'string' && img.isPrimary) ?? images[0];
  const rawUrl = typeof primary === 'string' ? primary : primary?.url;
  if (!rawUrl) return null;
  return rawUrl.startsWith('http') ? rawUrl : `${API_ORIGIN}${rawUrl}`;
}

export function AllStockScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search.trim(), 350);

  const {
    data,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteInventoryList({
    search: debouncedSearch || undefined,
    stockFilter: 'ALL',
    limit: 20,
  });

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const filteredItems = useMemo(() => {
    if (!selectedCategory) return items;
    return items.filter(
      (item) => (item.category || 'General') === selectedCategory,
    );
  }, [items, selectedCategory]);

  const categorySummaries = useMemo<CategorySummary[]>(() => {
    const map = new Map<string, CategorySummary>();

    for (const item of items) {
      const catName = item.category || 'General';
      const existing = map.get(catName);
      const itemImg = getFirstImageUri(item.images);

      if (existing) {
        existing.totalStock += item.currentStock;
        existing.productCount += 1;
        if (!existing.coverImageUri && itemImg) {
          existing.coverImageUri = itemImg;
        }
      } else {
        map.set(catName, {
          name: catName,
          coverImageUri: itemImg,
          totalStock: item.currentStock,
          productCount: 1,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [items]);

  const handleOpenAddStock = (item?: InventoryItem) => {
    navigation.navigate(
      'StockEntryForm',
      item
        ? {
            productId: item.productId,
            productName: item.productName,
            currentStock: item.currentStock,
            unit: item.unit,
          }
        : undefined,
    );
  };

  const handleSelectCategoryFromGrid = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setViewMode('list');
  };

  return (
    <View style={inventoryStyles.screen}>
      <View style={inventoryStyles.searchWrap}>
        <View style={inventoryStyles.searchRow}>
          <View style={inventoryStyles.searchBox}>
            <Search size={18} color={colors.textMuted} />
            <TextInput
              style={inventoryStyles.searchInput}
              placeholder={INVENTORY_COPY.searchPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <View style={inventoryStyles.viewToggleGroup}>
            <TouchableOpacity
              style={[
                inventoryStyles.viewToggleBtn,
                viewMode === 'list' && inventoryStyles.viewToggleActive,
              ]}
              onPress={() => setViewMode('list')}
            >
              <List
                size={18}
                color={
                  viewMode === 'list' ? colors.primary : colors.textSecondary
                }
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                inventoryStyles.viewToggleBtn,
                viewMode === 'grid' && inventoryStyles.viewToggleActive,
              ]}
              onPress={() => setViewMode('grid')}
            >
              <LayoutGrid
                size={18}
                color={
                  viewMode === 'grid' ? colors.primary : colors.textSecondary
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {selectedCategory && viewMode === 'list' ? (
          <View style={inventoryStyles.filterChipRow}>
            <TouchableOpacity
              style={inventoryStyles.activeFilterChip}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={inventoryStyles.activeFilterText}>
                Category: {selectedCategory}
              </Text>
              <X size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {isLoading ? (
        <View style={inventoryStyles.centerBox}>
          <IosLoader size={28} color={colors.primary} />
        </View>
      ) : viewMode === 'grid' ? (
        <FlatList
          key="grid-view"
          data={categorySummaries}
          numColumns={2}
          keyExtractor={(cat) => cat.name}
          columnWrapperStyle={inventoryStyles.gridColumnWrapper}
          contentContainerStyle={inventoryStyles.gridContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
              }}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <CategoryGridCard
              category={item}
              onPress={handleSelectCategoryFromGrid}
            />
          )}
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
              <PackageOpen size={40} color={colors.textMuted} />
              <Text style={inventoryStyles.emptyTitle}>
                {INVENTORY_COPY.emptyTitle}
              </Text>
              <Text style={inventoryStyles.emptySubtitle}>
                {INVENTORY_COPY.emptySubtitle}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          key="list-view"
          data={filteredItems}
          keyExtractor={(item) => item.productId}
          contentContainerStyle={inventoryStyles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
              }}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <StockItemCard
              item={item}
              onPress={(selected) =>
                navigation.navigate('ProductDetail', {
                  productId: selected.productId,
                })
              }
            />
          )}
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
              <PackageOpen size={40} color={colors.textMuted} />
              <Text style={inventoryStyles.emptyTitle}>
                {INVENTORY_COPY.emptyTitle}
              </Text>
              <Text style={inventoryStyles.emptySubtitle}>
                {INVENTORY_COPY.emptySubtitle}
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={inventoryStyles.fab}
        onPress={() => handleOpenAddStock()}
        activeOpacity={0.85}
      >
        <Plus size={18} color={colors.textInverse} />
        <Text style={inventoryStyles.fabText}>{INVENTORY_COPY.addStockBtn}</Text>
      </TouchableOpacity>
    </View>
  );
}
