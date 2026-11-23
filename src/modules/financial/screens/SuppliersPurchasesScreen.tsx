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
import {
  ChevronRight,
  Phone,
  Search,
  ShoppingBag,
  X,
} from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/types';
import { useDebounce } from '../../../core/hooks/useDebounce';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../core/theme';
import { inventoryStyles } from '../../inventory/styles';
import { SupplierOverviewBanner } from '../components';
import { usePurchaseExpenseSummary } from '../hooks';
import { SuppliersPurchasesSkeleton } from '../skeletons';
import type { SupplierSummaryItem } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

function fmtMoney(val?: number): string {
  return `₹${Number(val || 0).toLocaleString('en-IN')}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'S';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
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

export function SuppliersPurchasesScreen() {
  const navigation = useNavigation<NavProp>();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 300);

  const { data, isLoading, isRefetching, refetch } = usePurchaseExpenseSummary(
    debouncedSearch || undefined,
  );

  const summary = data?.summary;
  const suppliers = useMemo(() => data?.suppliers ?? [], [data?.suppliers]);
  const allPurchases = useMemo(() => data?.purchases ?? [], [data?.purchases]);

  if (isLoading && !data) {
    return <SuppliersPurchasesSkeleton />;
  }

  const handleOpenAllPurchases = () => {
    navigation.navigate('SupplierPurchaseDetail', {
      title: 'All Purchases',
      subtitle: `${summary?.totalPurchaseEntries ?? 0} purchase entries`,
      mode: 'ALL_PURCHASES',
      purchases: allPurchases,
      summaryStats: {
        totalAmount: summary?.totalPurchases ?? 0,
        materialCost: summary?.totalMaterialCost ?? 0,
        transportCost: summary?.totalTransportCost ?? 0,
        otherCost: summary?.totalOtherPurchaseCost ?? 0,
        count: summary?.totalPurchaseEntries ?? 0,
      },
    });
  };

  const handleOpenSupplier = (sup: SupplierSummaryItem) => {
    navigation.navigate('SupplierPurchaseDetail', {
      title: sup.supplierName,
      subtitle: `${sup.entryCount} ${sup.entryCount === 1 ? 'purchase' : 'purchases'}`,
      mode: 'SUPPLIER',
      supplier: sup,
    });
  };

  const listHeader = (
    <View>
      <SupplierOverviewBanner
        summary={summary}
        suppliersCount={suppliers.length}
        isLoading={isLoading}
        onPressOverview={() => navigation.navigate('SupplierOverviewDetail')}
      />

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Suppliers</Text>
          <Text style={styles.sectionSub}>
            {suppliers.length} supplier{suppliers.length === 1 ? '' : 's'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.allBillsBtn}
          onPress={handleOpenAllPurchases}
          activeOpacity={0.8}
        >
          <ShoppingBag size={13} color={colors.primary} />
          <Text style={styles.allBillsBtnText}>All Bills</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Search size={17} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search supplier name or phone..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 ? (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  const renderSupplierCard = ({ item }: { item: SupplierSummaryItem }) => (
    <TouchableOpacity
      style={styles.supplierCard}
      activeOpacity={0.8}
      onPress={() => handleOpenSupplier(item)}
    >
      <View style={styles.supTopRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {getInitials(item.supplierName)}
          </Text>
        </View>

        <View style={styles.supMeta}>
          <Text style={styles.supName} numberOfLines={1}>
            {item.supplierName}
          </Text>
          <View style={styles.supPhoneRow}>
            <Phone size={12} color={colors.textMuted} />
            <Text style={styles.supPhoneText}>
              {item.supplierPhone ? item.supplierPhone : 'No phone'}
            </Text>
          </View>
        </View>

        <View style={styles.supRight}>
          <Text style={styles.supTotal}>{fmtMoney(item.totalPurchaseCost)}</Text>
          <View style={styles.viewDetailsRow}>
            <Text style={styles.viewDetailsText}>View Details</Text>
            <ChevronRight size={13} color={colors.primary} />
          </View>
        </View>
      </View>

      <View style={styles.supFooterRow}>
        <View style={styles.supBadges}>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>
              {item.entryCount} {item.entryCount === 1 ? 'Purchase' : 'Purchases'}
            </Text>
          </View>
          {item.transportCost > 0 ? (
            <View style={styles.miniTag}>
              <Text style={styles.miniTagText}>
                Transport: {fmtMoney(item.transportCost)}
              </Text>
            </View>
          ) : null}
          {item.otherCost > 0 ? (
            <View style={styles.miniTag}>
              <Text style={styles.miniTagText}>
                Other: {fmtMoney(item.otherCost)}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.lastDateText}>
          Last: {formatDate(item.lastPurchaseDate)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={inventoryStyles.screen}>
      <FlatList
        data={suppliers}
        keyExtractor={(item, idx) => `${item.supplierName}-${idx}`}
        renderItem={renderSupplierCard}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <ShoppingBag size={30} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {debouncedSearch
                ? 'No matching suppliers'
                : 'No supplier purchases yet'}
            </Text>
            <Text style={styles.emptySub}>
              {debouncedSearch
                ? 'Try a different supplier name or phone.'
                : 'Purchased stock entries will appear here automatically.'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
            }}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  kpiVal: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 4,
  },
  warningText: {
    color: colors.warning,
  },
  kpiSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  totalSpendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  totalSpendLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  totalSpendTextWrap: {
    flex: 1,
  },
  totalSpendLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  totalSpendHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  totalSpendVal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    flexShrink: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  sectionSub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  allBillsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  allBillsBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  expenseList: {
    gap: spacing.xs + 2,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  expenseIconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseMeta: {
    flex: 1,
  },
  expenseLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  expenseCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  viewDetailsText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  emptyMiniCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyMiniText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  supplierCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  supTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  supMeta: {
    flex: 1,
  },
  supName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  supPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  supPhoneText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  supRight: {
    alignItems: 'flex-end',
  },
  supTotal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  supFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  supBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  countPill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.xs + 4,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  countPillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  miniTag: {
    backgroundColor: colors.surfacePressed,
    paddingHorizontal: spacing.xs + 4,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  miniTagText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  lastDateText: {
    fontSize: fontSize.xs,
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
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptySub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
