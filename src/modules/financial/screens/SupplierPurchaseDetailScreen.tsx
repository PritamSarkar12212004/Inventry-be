import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Calendar, FileText, Phone, Receipt, Search, X } from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/types';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../core/theme';
import { inventoryStyles } from '../../inventory/styles';
import {
  MonthYearPickerModal,
  getMonthRange,
  type SelectedMonth,
} from '../components';
import type {
  ExpenseRecordDetail,
  PurchaseEntryDetailItem,
} from '../types';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'SupplierPurchaseDetail'
>;

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
    year: 'numeric',
  });
}

function matchesSelectedMonth(
  dateStr: string | undefined,
  selectedMonth: SelectedMonth,
): boolean {
  if (!selectedMonth) return true;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  if (selectedMonth.preset === 'LAST_3_MONTHS') {
    const range = getMonthRange(
      selectedMonth.year,
      selectedMonth.month,
      selectedMonth.preset,
    );
    const t = d.getTime();
    return (
      t >= new Date(range.startDate).getTime() &&
      t <= new Date(range.endDate).getTime()
    );
  }
  if (selectedMonth.month === null) {
    return d.getFullYear() === selectedMonth.year;
  }
  return (
    d.getFullYear() === selectedMonth.year &&
    d.getMonth() === selectedMonth.month
  );
}

export function SupplierPurchaseDetailScreen({ route, navigation }: Props) {
  const { title, mode, supplier, category, purchases, summaryStats } =
    route.params;
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<SelectedMonth>(() => ({
    year: new Date().getFullYear(),
    month: null,
  }));
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const periodLabel = useMemo(
    () =>
      selectedMonth
        ? getMonthRange(
            selectedMonth.year,
            selectedMonth.month,
            selectedMonth.preset,
          ).label
        : 'All Time',
    [selectedMonth],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title,
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerCalBtn}
          activeOpacity={0.75}
          onPress={() => setFilterModalOpen(true)}
        >
          <Calendar size={16} color={colors.primary} />
          <Text style={styles.headerCalText}>{periodLabel}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, title, periodLabel]);

  const query = search.trim().toLowerCase();

  const dateFilteredPurchases = useMemo<PurchaseEntryDetailItem[]>(() => {
    const list =
      mode === 'SUPPLIER' ? (supplier?.entries ?? []) : (purchases ?? []);
    if (!selectedMonth) return list;
    return list.filter((entry) =>
      matchesSelectedMonth(entry.entryDate, selectedMonth),
    );
  }, [mode, supplier?.entries, purchases, selectedMonth]);

  const filteredPurchases = useMemo<PurchaseEntryDetailItem[]>(() => {
    if (!query) return dateFilteredPurchases;
    return dateFilteredPurchases.filter(
      (entry) =>
        entry.entryNumber.toLowerCase().includes(query) ||
        entry.supplierName.toLowerCase().includes(query) ||
        entry.items.some((it) =>
          it.productName.toLowerCase().includes(query),
        ),
    );
  }, [dateFilteredPurchases, query]);

  const dateFilteredExpenseRecords = useMemo<ExpenseRecordDetail[]>(() => {
    const list = category?.records ?? [];
    if (!selectedMonth) return list;
    return list.filter((rec) => matchesSelectedMonth(rec.date, selectedMonth));
  }, [category?.records, selectedMonth]);

  const filteredExpenseRecords = useMemo<ExpenseRecordDetail[]>(() => {
    if (!query) return dateFilteredExpenseRecords;
    return dateFilteredExpenseRecords.filter(
      (rec) =>
        rec.title.toLowerCase().includes(query) ||
        rec.referenceNumber.toLowerCase().includes(query) ||
        rec.subtitle.toLowerCase().includes(query),
    );
  }, [dateFilteredExpenseRecords, query]);

  const headerCard = () => {
    if (mode === 'EXPENSE_CATEGORY' && category) {
      const catCount = selectedMonth
        ? dateFilteredExpenseRecords.length
        : category.count;
      const catTotal = selectedMonth
        ? dateFilteredExpenseRecords.reduce(
            (sum, r) => sum + Number(r.totalAmount || 0),
            0,
          )
        : category.totalAmount;
      return (
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.iconCircle}>
              <Receipt size={20} color={colors.primary} />
            </View>
            <View style={styles.summaryTopMeta}>
              <Text style={styles.summaryTitle}>{category.label}</Text>
              <Text style={styles.summarySub}>
                {catCount} {catCount === 1 ? 'record' : 'records'}
              </Text>
            </View>
            <Text style={styles.summaryBigAmount}>
              {fmtMoney(catTotal)}
            </Text>
          </View>
        </View>
      );
    }

    const totalAmt = selectedMonth
      ? dateFilteredPurchases.reduce(
          (sum, e) => sum + Number(e.totalPurchaseCost || 0),
          0,
        )
      : mode === 'SUPPLIER'
        ? (supplier?.totalPurchaseCost ?? 0)
        : (summaryStats?.totalAmount ?? 0);
    const matCost = selectedMonth
      ? dateFilteredPurchases.reduce(
          (sum, e) => sum + Number(e.materialCost || 0),
          0,
        )
      : mode === 'SUPPLIER'
        ? (supplier?.materialCost ?? 0)
        : (summaryStats?.materialCost ?? 0);
    const transCost = selectedMonth
      ? dateFilteredPurchases.reduce(
          (sum, e) => sum + Number(e.transportCost || 0),
          0,
        )
      : mode === 'SUPPLIER'
        ? (supplier?.transportCost ?? 0)
        : (summaryStats?.transportCost ?? 0);
    const othCost = selectedMonth
      ? dateFilteredPurchases.reduce(
          (sum, e) => sum + Number(e.otherCost || 0),
          0,
        )
      : mode === 'SUPPLIER'
        ? (supplier?.otherCost ?? 0)
        : (summaryStats?.otherCost ?? 0);
    const count = selectedMonth
      ? dateFilteredPurchases.length
      : mode === 'SUPPLIER'
        ? (supplier?.entryCount ?? 0)
        : (summaryStats?.count ?? filteredPurchases.length);

    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View style={styles.summaryTopMeta}>
            <Text style={styles.summaryTitle}>
              {mode === 'SUPPLIER' ? supplier?.supplierName : 'All Purchases'}
            </Text>
            <Text style={styles.summarySub}>
              {count} {count === 1 ? 'purchase entry' : 'purchase entries'}
              {supplier?.supplierGstin ? ` • GSTIN: ${supplier.supplierGstin}` : ''}
            </Text>
            {supplier?.supplierPhone ? (
              <TouchableOpacity
                style={styles.phoneChip}
                onPress={() => Linking.openURL(`tel:${supplier.supplierPhone}`)}
                activeOpacity={0.75}
              >
                <Phone size={12} color={colors.primary} />
                <Text style={styles.phoneChipText}>
                  {supplier.supplierPhone}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <Text style={styles.summaryBigAmount}>{fmtMoney(totalAmt)}</Text>
        </View>

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownCell}>
            <Text style={styles.breakdownLabel}>Material</Text>
            <Text style={styles.breakdownVal}>{fmtMoney(matCost)}</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownCell}>
            <Text style={styles.breakdownLabel}>Transport</Text>
            <Text style={styles.breakdownVal}>{fmtMoney(transCost)}</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownCell}>
            <Text style={styles.breakdownLabel}>Other</Text>
            <Text style={styles.breakdownVal}>{fmtMoney(othCost)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const listHeader = (
    <View>
      {headerCard()}
      <View style={styles.searchBox}>
        <Search size={17} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={
            mode === 'EXPENSE_CATEGORY'
              ? 'Search expense title or ref #...'
              : 'Search entry #, product, or supplier...'
          }
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

  const renderPurchaseCard = ({ item }: { item: PurchaseEntryDetailItem }) => (
    <View style={styles.detailCard}>
      <View style={styles.cardTopRow}>
        <View style={styles.entryTitleWrap}>
          <Text style={styles.entryNumber}>{item.entryNumber}</Text>
          {mode === 'ALL_PURCHASES' ? (
            <Text style={styles.supplierTag} numberOfLines={1}>
              {item.supplierName}
            </Text>
          ) : null}
        </View>
        <Text style={styles.dateText}>{formatDate(item.entryDate)}</Text>
      </View>

      <View style={styles.itemsBox}>
        {item.items.map((line, idx) => (
          <View key={`${item.id}-line-${idx}`} style={styles.itemLine}>
            <Text style={styles.itemName} numberOfLines={1}>
              {line.productName}
            </Text>
            <Text style={styles.itemQty}>
              {line.quantity} {line.unit || ''}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.costGrid}>
        <View style={styles.costCell}>
          <Text style={styles.costLabel}>Material</Text>
          <Text style={styles.costVal}>{fmtMoney(item.materialCost)}</Text>
        </View>
        <View style={styles.costCell}>
          <Text style={styles.costLabel}>Transport</Text>
          <Text style={styles.costVal}>{fmtMoney(item.transportCost)}</Text>
        </View>
        <View style={styles.costCell}>
          <Text style={styles.costLabel}>Other</Text>
          <Text style={styles.costVal}>{fmtMoney(item.otherCost)}</Text>
        </View>
        <View style={styles.costCellRight}>
          <Text style={styles.costLabel}>Total</Text>
          <Text style={styles.costTotalVal}>
            {fmtMoney(item.totalPurchaseCost)}
          </Text>
        </View>
      </View>

      {item.remarks ? (
        <Text style={styles.remarksText}>Note: {item.remarks}</Text>
      ) : null}
    </View>
  );

  const renderExpenseRecordCard = ({ item }: { item: ExpenseRecordDetail }) => (
    <View style={styles.detailCard}>
      <View style={styles.cardTopRow}>
        <View style={styles.entryTitleWrap}>
          <Text style={styles.entryNumber}>{item.title}</Text>
          {item.referenceNumber ? (
            <View style={styles.refBadge}>
              <Text style={styles.refBadgeText}>{item.referenceNumber}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.dateText}>{formatDate(item.date)}</Text>
      </View>

      {item.subtitle ? (
        <Text style={styles.expenseSubtitle}>{item.subtitle}</Text>
      ) : null}

      <View style={styles.expenseFooterRow}>
        <View style={styles.expenseNums}>
          <Text style={styles.costLabel}>
            Amount: {fmtMoney(item.amount)}
            {item.gstAmount > 0 ? ` • GST: ${fmtMoney(item.gstAmount)}` : ''}
          </Text>
        </View>
        <Text style={styles.costTotalVal}>{fmtMoney(item.totalAmount)}</Text>
      </View>

      {item.notes ? (
        <Text style={styles.remarksText}>Note: {item.notes}</Text>
      ) : null}
    </View>
  );

  if (mode === 'EXPENSE_CATEGORY') {
    return (
      <View style={inventoryStyles.screen}>
        <FlatList
          data={filteredExpenseRecords}
          keyExtractor={(item) => item.id}
          renderItem={renderExpenseRecordCard}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <FileText size={28} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No expense records found</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
        <MonthYearPickerModal
          visible={filterModalOpen}
          selectedMonth={selectedMonth}
          onSelect={setSelectedMonth}
          onClose={() => setFilterModalOpen(false)}
        />
      </View>
    );
  }

  return (
    <View style={inventoryStyles.screen}>
      <FlatList
        data={filteredPurchases}
        keyExtractor={(item) => item.id}
        renderItem={renderPurchaseCard}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <FileText size={28} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No purchase entries found</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
      <MonthYearPickerModal
        visible={filterModalOpen}
        selectedMonth={selectedMonth}
        onSelect={setSelectedMonth}
        onClose={() => setFilterModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTopMeta: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  summarySub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  summaryBigAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  phoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  phoneChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  breakdownCell: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownDivider: {
    width: 1,
    height: 26,
    backgroundColor: colors.border,
  },
  breakdownLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  breakdownVal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
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
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  entryTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  entryNumber: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  supplierTag: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  refBadge: {
    backgroundColor: colors.surfacePressed,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  refBadgeText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  itemsBox: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    gap: 4,
  },
  itemLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  itemName: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  itemQty: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  costGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  costCell: {
    flex: 1,
  },
  costCellRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  costLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  costVal: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  costTotalVal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  expenseSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  expenseFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  expenseNums: {
    flex: 1,
  },
  remarksText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
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
  headerCalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  headerCalText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
});
