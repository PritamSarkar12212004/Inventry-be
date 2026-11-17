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
import { FileText, Plus, Search, ShoppingBag } from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/types';
import { IosLoader } from '../../../core/components/IosLoader';
import { useDebounce } from '../../../core/hooks/useDebounce';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../core/theme';
import { inventoryStyles } from '../../inventory/styles';
import { useInfiniteSalesOrders } from '../hooks';
import type { SalesOrderRecord } from '../types';

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

export function SalesOrdersScreen() {
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
  } = useInfiniteSalesOrders(debouncedSearch || undefined);

  const orders = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderOrderCard = ({ item }: { item: SalesOrderRecord }) => {
    const hasGst = Boolean(item.includeGst && Number(item.tax || 0) > 0);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.82}
        onPress={() =>
          navigation.navigate('SalesOrderDetail', { orderId: item._id })
        }
      >
        <View style={styles.cardTopRow}>
          <View style={styles.orderNumWrap}>
            <FileText size={15} color={colors.primary} />
            <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          </View>
          <View style={[styles.gstBadge, hasGst ? styles.gstOn : styles.gstOff]}>
            <Text
              style={[
                styles.gstBadgeText,
                hasGst ? styles.gstOnText : styles.gstOffText,
              ]}
            >
              {hasGst ? 'GST' : 'No GST'}
            </Text>
          </View>
        </View>

        <Text style={styles.customerName} numberOfLines={1}>
          {item.customerSnapshot?.name || 'Walk-In Customer'}
        </Text>
        <Text style={styles.customerMeta} numberOfLines={1}>
          {item.customerSnapshot?.phone || 'No phone'} •{' '}
          {formatDate(item.orderDate)}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={styles.itemCount}>
            {item.items?.length ?? 0}{' '}
            {(item.items?.length ?? 0) === 1 ? 'item' : 'items'}
          </Text>
          <Text style={styles.grandTotal}>
            ₹{Number(item.grandTotal || 0).toLocaleString('en-IN')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={inventoryStyles.screen}>
      <View style={inventoryStyles.searchWrap}>
        <View style={inventoryStyles.searchBox}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={inventoryStyles.searchInput}
            placeholder="Search order #, customer name or phone..."
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
          data={orders}
          keyExtractor={(item) => item._id}
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
          renderItem={renderOrderCard}
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
              <ShoppingBag size={40} color={colors.textMuted} />
              <Text style={inventoryStyles.emptyTitle}>No sales orders yet</Text>
              <Text style={inventoryStyles.emptySubtitle}>
                Tap &quot;New Sale&quot; to create an order and share its PDF.
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={inventoryStyles.fab}
        onPress={() => navigation.navigate('SalesOrderForm')}
        activeOpacity={0.85}
      >
        <Plus size={18} color={colors.textInverse} />
        <Text style={inventoryStyles.fabText}>New Sale</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderNumWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderNumber: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  gstBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  gstOn: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
  },
  gstOff: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
  },
  gstBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  gstOnText: {
    color: colors.success,
  },
  gstOffText: {
    color: colors.textSecondary,
  },
  customerName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  customerMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  itemCount: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  grandTotal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
});
