import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import {
  Calendar,
  Plus,
  Receipt,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react-native';
import type { AxiosError } from 'axios';
import { IosConfirmModal } from '../../../core/components/IosConfirmModal';
import { useDebounce } from '../../../core/hooks/useDebounce';
import { popup } from '../../../core/store/popupStore';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from '../../../core/theme';
import { AuthButton } from '../../auth/components';
import {
  useCreateExpense,
  useDeleteExpense,
  useInfiniteExpenses,
} from '../hooks';
import { PendingCustomersListSkeleton } from '../skeletons';
import type { ExpenseCategory, ExpenseItem } from '../types';

type ExpensesMode = 'GENERAL' | 'MANPOWER';

const GENERAL_CATEGORIES: Array<{ label: string; value: ExpenseCategory }> = [
  { label: 'Rent & Utilities', value: 'RENT_UTILITIES' },
  { label: 'Electricity', value: 'ELECTRICITY' },
  { label: 'Transport', value: 'TRANSPORT' },
  { label: 'Packaging', value: 'PACKAGING' },
  { label: 'Shipping', value: 'SHIPPING_COURIER' },
  { label: 'Maintenance', value: 'MAINTENANCE' },
  { label: 'Marketing', value: 'MARKETING' },
  { label: 'Other', value: 'MISCELLANEOUS' },
];

const CATEGORY_LABELS: Record<string, string> = {
  RAW_MATERIAL: 'Raw Material',
  PACKAGING: 'Packaging',
  IN_HOUSE_PRODUCTION: 'Production',
  SHIPPING_COURIER: 'Shipping',
  LABOUR_WAGES: 'Manpower',
  RENT_UTILITIES: 'Rent & Utilities',
  ELECTRICITY: 'Electricity',
  MARKETING: 'Marketing',
  TRANSPORT: 'Transport',
  MAINTENANCE: 'Maintenance',
  MISCELLANEOUS: 'Other',
};

function fmtMoney(val?: number): string {
  return `₹${Number(val || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;
}

function fmtDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function ExpensesScreen({ mode = 'GENERAL' }: { mode?: ExpensesMode }) {
  const isManpower = mode === 'MANPOWER';
  const insets = useSafeAreaInsets();
  const addSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(
    () => (isManpower ? ['62%', '85%'] : ['75%', '92%']),
    [isManpower],
  );

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 350);

  const [category, setCategory] = useState<ExpenseCategory>(
    isManpower ? 'LABOUR_WAGES' : 'RENT_UTILITIES',
  );
  const [title, setTitle] = useState('');
  const [amountText, setAmountText] = useState('');
  const [notes, setNotes] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ExpenseItem | null>(null);

  const {
    data,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteExpenses(debouncedSearch || undefined);

  const { mutate: createExpense, isPending: isCreating } = useCreateExpense();
  const { mutate: deleteExpense, isPending: isDeleting } = useDeleteExpense();

  const items = useMemo(() => {
    const all = data?.pages.flatMap((p) => p.items) ?? [];
    return all.filter((item) =>
      isManpower
        ? item.category === 'LABOUR_WAGES'
        : item.category !== 'LABOUR_WAGES',
    );
  }, [data, isManpower]);

  const totalAmount = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.totalAmount ?? it.amount ?? 0), 0),
    [items],
  );

  const resetForm = () => {
    setCategory(isManpower ? 'LABOUR_WAGES' : 'RENT_UTILITIES');
    setTitle('');
    setAmountText('');
    setNotes('');
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.45}
      />
    ),
    [],
  );

  const handleOpenAdd = () => {
    resetForm();
    addSheetRef.current?.present();
  };

  const handleCloseAdd = () => {
    addSheetRef.current?.dismiss();
  };

  const handleCreate = () => {
    if (isCreating) return;
    const trimmedTitle = title.trim();
    const amount = Number.parseFloat(amountText);
    if (!trimmedTitle) {
      popup.error(
        'Required',
        isManpower ? 'Worker / manpower title is required.' : 'Expense title is required.',
      );
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      popup.error('Invalid Amount', 'Please enter an amount greater than 0.');
      return;
    }

    createExpense(
      {
        category: isManpower ? 'LABOUR_WAGES' : category,
        title: trimmedTitle,
        amount,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      },
      {
        onSuccess: () => {
          addSheetRef.current?.dismiss();
          resetForm();
          popup.success(
            'Added',
            isManpower ? 'Manpower expense recorded.' : 'Expense recorded.',
          );
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<{ message?: string }>;
          popup.error(
            'Save Failed',
            axiosErr.response?.data?.message || 'Unable to save expense.',
          );
        },
      },
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget || isDeleting) return;
    deleteExpense(deleteTarget._id, {
      onSuccess: () => {
        setDeleteTarget(null);
      },
      onError: (err) => {
        setDeleteTarget(null);
        const axiosErr = err as AxiosError<{ message?: string }>;
        popup.error(
          'Delete Failed',
          axiosErr.response?.data?.message || 'Unable to delete expense.',
        );
      },
    });
  };

  if (isLoading && items.length === 0) {
    return <PendingCustomersListSkeleton />;
  }

  return (
    <View style={styles.screen}>
      {/* Summary + Search Header */}
      <View style={styles.topBar}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            {isManpower ? (
              <Users size={18} color={colors.primary} />
            ) : (
              <Receipt size={18} color={colors.primary} />
            )}
          </View>
          <View style={styles.summaryTextWrap}>
            <Text style={styles.summaryLabel}>
              {isManpower ? 'Manpower Expenses' : 'General Expenses'}
            </Text>
            <Text style={styles.summaryCount}>
              {items.length} {items.length === 1 ? 'entry' : 'entries'}
            </Text>
          </View>
          <Text style={styles.summaryTotal}>{fmtMoney(totalAmount)}</Text>
        </View>

        <View style={styles.searchBox}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              isManpower ? 'Search manpower expense...' : 'Search expense...'
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

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
            }}
            tintColor={colors.primary}
          />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>
              {isManpower ? 'No Manpower Expenses' : 'No General Expenses'}
            </Text>
            <Text style={styles.emptySub}>
              Tap + to add your first{' '}
              {isManpower ? 'manpower expense' : 'expense'}.
            </Text>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : undefined
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.metaRow}>
                  <View style={styles.catPill}>
                    <Text style={styles.catPillText}>
                      {CATEGORY_LABELS[item.category] || item.category}
                    </Text>
                  </View>
                  <View style={styles.dateRow}>
                    <Calendar size={11} color={colors.textMuted} />
                    <Text style={styles.dateText}>
                      {fmtDate(item.expenseDate)}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.rightCol}>
                <Text style={styles.amountText}>
                  {fmtMoney(item.totalAmount ?? item.amount)}
                </Text>
                <TouchableOpacity
                  onPress={() => setDeleteTarget(item)}
                  hitSlop={8}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={14} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
            {item.notes ? (
              <Text style={styles.notesText} numberOfLines={2}>
                {item.notes}
              </Text>
            ) : null}
          </View>
        )}
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={handleOpenAdd}
      >
        <Plus size={24} color={colors.surface} />
      </TouchableOpacity>

      {/* Add Expense Bottom Sheet */}
      <BottomSheetModal
        ref={addSheetRef}
        index={0}
        snapPoints={snapPoints}
        topInset={insets.top}
        enablePanDownToClose
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.sheetBg}
      >
        <View style={styles.sheetHeader}>
          <View style={styles.sheetTitleRow}>
            <View style={styles.sheetIconBadge}>
              {isManpower ? (
                <Users size={18} color={colors.primary} />
              ) : (
                <Receipt size={18} color={colors.primary} />
              )}
            </View>
            <View>
              <Text style={styles.sheetTitle}>
                {isManpower ? 'Add Manpower Expense' : 'Add Expense'}
              </Text>
              <Text style={styles.sheetSubtitle}>
                {isManpower
                  ? 'Record daily wages & labour cost'
                  : 'Record operational expense'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleCloseAdd}
            hitSlop={8}
          >
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <BottomSheetScrollView
          contentContainerStyle={[
            styles.sheetBody,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!isManpower ? (
            <View style={styles.sectionBlock}>
              <Text style={styles.fieldLabel}>Category *</Text>
              <View style={styles.chipGrid}>
                {GENERAL_CATEGORIES.map((c) => {
                  const active = category === c.value;
                  return (
                    <TouchableOpacity
                      key={c.value}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setCategory(c.value)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={styles.sectionBlock}>
            <Text style={styles.fieldLabel}>
              {isManpower ? 'Worker / Purpose *' : 'Title *'}
            </Text>
            <BottomSheetTextInput
              style={styles.input}
              placeholder={
                isManpower
                  ? 'e.g. Packing staff daily wages'
                  : 'e.g. Shop rent / Electricity bill'
              }
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.fieldLabel}>Amount (₹) *</Text>
            <View style={styles.amountInputWrap}>
              <View style={styles.currencyPrefix}>
                <Text style={styles.currencySymbol}>₹</Text>
              </View>
              <BottomSheetTextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={amountText}
                onChangeText={setAmountText}
              />
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.fieldLabel}>Notes (Optional)</Text>
            <BottomSheetTextInput
              style={[styles.input, styles.multiline]}
              placeholder="Add bill number, worker count, or details..."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          <View style={styles.saveWrap}>
            <AuthButton
              title={isManpower ? 'Save Manpower Expense' : 'Save Expense'}
              onPress={handleCreate}
              loading={isCreating}
            />
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>

      <IosConfirmModal
        visible={Boolean(deleteTarget)}
        title="Delete Expense"
        message={`Delete "${deleteTarget?.title || ''}"?`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    padding: spacing.md,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextWrap: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  summaryCount: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  summaryTotal: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: 96,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitleWrap: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  catPillText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  amountText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  deleteBtn: {
    padding: 4,
  },
  notesText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 4,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.floating,
  },
  sheetBg: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sheetIconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  sheetSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sectionBlock: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primary,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    overflow: 'hidden',
  },
  currencyPrefix: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  amountInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  multiline: {
    minHeight: 78,
    textAlignVertical: 'top',
  },
  saveWrap: {
    marginTop: spacing.sm,
  },
});
