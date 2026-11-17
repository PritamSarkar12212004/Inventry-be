import React, { useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PackageCheck, Search } from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/types';
import { IosLoader } from '../../../core/components/IosLoader';
import { useDebounce } from '../../../core/hooks/useDebounce';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../core/theme';
import { StockItemCard } from '../components';
import { INVENTORY_COPY } from '../data';
import { useInfiniteInventoryList } from '../hooks';
import { inventoryStyles } from '../styles';

type AlertFilter = 'LOW_STOCK' | 'OUT_OF_STOCK';

export function LowStockScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<AlertFilter>('LOW_STOCK');

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
    stockFilter,
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

  return (
    <View style={inventoryStyles.screen}>
      <View style={inventoryStyles.searchWrap}>
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

        <View style={styles.tabRow}>
          {(
            [
              { key: 'LOW_STOCK', label: 'Low Stock' },
              { key: 'OUT_OF_STOCK', label: 'Out of Stock' },
            ] as const
          ).map((tab) => {
            const active = stockFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                onPress={() => setStockFilter(tab.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <View style={inventoryStyles.centerBox}>
          <IosLoader size={28} color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
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
              showCategory={false}
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
              <PackageCheck size={40} color={colors.textMuted} />
              <Text style={inventoryStyles.emptyTitle}>
                {stockFilter === 'OUT_OF_STOCK'
                  ? 'No out of stock items'
                  : 'No low stock items'}
              </Text>
              <Text style={inventoryStyles.emptySubtitle}>
                {stockFilter === 'OUT_OF_STOCK'
                  ? 'None of your products are currently out of stock.'
                  : 'All your products currently have healthy stock levels.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
});
