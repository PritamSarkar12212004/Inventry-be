import React, { useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PackageCheck, Search } from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/types';
import { IosLoader } from '../../../core/components/IosLoader';
import { useDebounce } from '../../../core/hooks/useDebounce';
import { colors } from '../../../core/theme';
import { StockItemCard } from '../components';
import { INVENTORY_COPY } from '../data';
import { useInfiniteInventoryList } from '../hooks';
import { inventoryStyles } from '../styles';

export function LowStockScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState('');

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
    stockFilter: 'LOW_STOCK',
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
              <Text style={inventoryStyles.emptyTitle}>No low stock items</Text>
              <Text style={inventoryStyles.emptySubtitle}>
                All your products currently have healthy stock levels.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
