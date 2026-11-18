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
  ArrowUpDown,
  Check,
  Phone,
  Search,
  User,
  Users,
  X,
} from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/types';
import { IosLoader } from '../../../core/components/IosLoader';
import { useDebounce } from '../../../core/hooks/useDebounce';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../core/theme';
import { inventoryStyles } from '../../inventory/styles';
import { useInfiniteCustomers } from '../hooks';
import { CustomerListSkeleton } from '../skeletons';
import type { CustomerItem, CustomerSortBy } from '../types';

const CUSTOMER_SORT_OPTIONS: Array<{ label: string; value: CustomerSortBy }> = [
  { label: 'Newest First', value: 'NEWEST' },
  { label: 'Paid %: High → Low', value: 'PAID_DESC' },
  { label: 'Paid %: Low → High', value: 'PAID_ASC' },
  { label: 'Amount: High → Low', value: 'SPENT_DESC' },
  { label: 'Amount: Low → High', value: 'SPENT_ASC' },
  { label: 'Orders: High → Low', value: 'ORDERS_DESC' },
  { label: 'Orders: Low → High', value: 'ORDERS_ASC' },
  { label: 'Name: A → Z', value: 'NAME_ASC' },
];

export function CustomersScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<CustomerSortBy>('NEWEST');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(120);
  const sortBtnRef = useRef<React.ComponentRef<typeof View>>(null);
  const debouncedSearch = useDebounce(search.trim(), 350);

  const handleOpenSortMenu = () => {
    sortBtnRef.current?.measureInWindow((_x, y, _w, height) => {
      setMenuTop(y + height + 6);
      setSortMenuOpen(true);
    });
  };

  const {
    data,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteCustomers(debouncedSearch || undefined, sortBy);

  const activeSortLabel =
    CUSTOMER_SORT_OPTIONS.find((f) => f.value === sortBy)?.label || '';

  const customers = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderCustomer = ({ item }: { item: CustomerItem }) => {
    const totalOrders = Number(item.totalOrders || 0);
    const totalSpent = Number(item.totalSpent || 0);
    const totalPaid = Number(item.totalPaid || 0);
    const pendingBalance = Math.max(0, totalSpent - totalPaid);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.82}
        onPress={() =>
          navigation.navigate('CustomerDetail', { customer: item })
        }
      >
        <View style={styles.topRow}>
          <View style={styles.avatar}>
            <User size={18} color={colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.phoneRow}>
              <Phone size={12} color={colors.textSecondary} />
              <Text style={styles.phone}>{item.phone || 'No phone'}</Text>
            </View>
            {item.billingAddress || item.address ? (
              <Text style={styles.address} numberOfLines={1}>
                {item.billingAddress || item.address}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statsLeft}>
            <Text style={styles.statsMeta}>
              {totalOrders} {totalOrders === 1 ? 'Order' : 'Orders'}
            </Text>
            {pendingBalance > 0 ? (
              <View style={styles.pendingPill}>
                <Text style={styles.pendingPillText}>
                  Pending: ₹{pendingBalance.toLocaleString('en-IN')}
                </Text>
              </View>
            ) : totalOrders > 0 ? (
              <View style={styles.settledPill}>
                <Text style={styles.settledPillText}>Settled</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.statsTotal}>
            ₹{totalSpent.toLocaleString('en-IN')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={inventoryStyles.screen}>
      <View style={inventoryStyles.searchWrap}>
        <View style={inventoryStyles.searchRow}>
          <View style={inventoryStyles.searchBox}>
            <Search size={18} color={colors.textMuted} />
            <TextInput
              style={inventoryStyles.searchInput}
              placeholder="Search customer name or phone..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <View ref={sortBtnRef} collapsable={false}>
            <TouchableOpacity
              style={[
                styles.sortBtn,
                sortBy !== 'NEWEST' && styles.sortBtnActive,
              ]}
              onPress={handleOpenSortMenu}
              activeOpacity={0.8}
            >
              <ArrowUpDown
                size={18}
                color={
                  sortBy !== 'NEWEST' ? colors.primary : colors.textSecondary
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {sortBy !== 'NEWEST' ? (
          <View style={inventoryStyles.filterChipRow}>
            <TouchableOpacity
              style={inventoryStyles.activeFilterChip}
              onPress={() => setSortBy('NEWEST')}
            >
              <Text style={inventoryStyles.activeFilterText}>
                Sort: {activeSortLabel}
              </Text>
              <X size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {isLoading ? (
        <CustomerListSkeleton />
      ) : (
        <FlatList
          data={customers}
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
          renderItem={renderCustomer}
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
              <Users size={40} color={colors.textMuted} />
              <Text style={inventoryStyles.emptyTitle}>No customers yet</Text>
              <Text style={inventoryStyles.emptySubtitle}>
                Customers are added automatically when you create a sale.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={sortMenuOpen}
        transparent
        animationType="none"
        onRequestClose={() => setSortMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.menuBackdrop}
          activeOpacity={1}
          onPress={() => setSortMenuOpen(false)}
        >
          <View style={[styles.menuCard, { top: menuTop }]}>
            {CUSTOMER_SORT_OPTIONS.map((opt, idx) => {
              const selected = sortBy === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.sortOption,
                    idx === CUSTOMER_SORT_OPTIONS.length - 1 &&
                      styles.sortOptionLast,
                    selected && styles.sortOptionActive,
                  ]}
                  onPress={() => {
                    setSortBy(opt.value);
                    setSortMenuOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      selected && styles.sortOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {selected ? (
                    <Check size={16} color={colors.primary} />
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
  sortBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortBtnActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuCard: {
    position: 'absolute',
    right: spacing.lg,
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  sortOptionLast: {
    borderBottomWidth: 0,
  },
  sortOptionActive: {
    backgroundColor: colors.primarySoft,
  },
  sortOptionText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  sortOptionTextActive: {
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  phone: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  address: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    flexWrap: 'wrap',
  },
  pendingPill: {
    backgroundColor: colors.dangerBg,
    paddingHorizontal: spacing.xs + 4,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  pendingPillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.danger,
  },
  settledPill: {
    backgroundColor: colors.successBg,
    paddingHorizontal: spacing.xs + 4,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  settledPillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
  statsMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  statsTotal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
});
