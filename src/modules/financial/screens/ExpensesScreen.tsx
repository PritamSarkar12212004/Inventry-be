import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Hash,
  IndianRupee,
  Layers,
  Pencil,
  Plus,
  Receipt,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';
import type { AxiosError } from 'axios';
import type { RootStackParamList } from '../../../core/navigation/types';
import { IosConfirmModal } from '../../../core/components/IosConfirmModal';
import { SkeletonBox } from '../../../core/components/SkeletonBox';
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
  useInfiniteExpenseTitles,
  useUpdateExpense,
} from '../hooks';
import {
  ExpenseFooterSkeleton,
  ExpenseListSkeleton,
} from '../skeletons';
import type {
  ExpenseCategory,
  ExpenseItem,
  ManpowerWorkType,
} from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

type ExpensesMode = 'GENERAL' | 'MANPOWER';

const WORK_TYPE_FILTERS: Array<{
  label: string;
  value: 'ALL' | ManpowerWorkType;
}> = [
  { label: 'All', value: 'ALL' },
  { label: 'Contract', value: 'CONTRACT' },
  { label: 'Salary', value: 'SALARY' },
  { label: 'Daily Wage', value: 'DAILY_WAGE' },
];

const WORK_TYPE_OPTIONS: Array<{
  label: string;
  value: ManpowerWorkType;
}> = [
  { label: 'Contract (Per Unit)', value: 'CONTRACT' },
  { label: 'Salary', value: 'SALARY' },
  { label: 'Daily Wage', value: 'DAILY_WAGE' },
];

const WORK_TYPE_LABELS: Record<ManpowerWorkType, string> = {
  CONTRACT: 'Contract',
  SALARY: 'Salary',
  DAILY_WAGE: 'Daily Wage',
};

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

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function getMonthRange(year: number, month: number | null) {
  if (month === null) {
    return {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      label: `Year ${year}`,
    };
  }
  const lastDay = new Date(year, month, 0).getDate();
  const mm = String(month).padStart(2, '0');
  return {
    startDate: `${year}-${mm}-01`,
    endDate: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
    label: `${MONTH_NAMES[month - 1] ?? ''} ${year}`,
  };
}

export function ExpensesScreen({
  mode = 'GENERAL',
  categoryCode,
  categoryName,
  titleFilter,
  lockedWorkType,
}: {
  mode?: ExpensesMode;
  categoryCode?: string;
  categoryName?: string;
  titleFilter?: string;
  lockedWorkType?: ManpowerWorkType;
}) {
  const navigation = useNavigation<NavProp>();
  const isManpower = mode === 'MANPOWER';
  const hasFixedCategory = Boolean(categoryCode);
  const isDetailMode = Boolean(titleFilter);
  const insets = useSafeAreaInsets();
  const addSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(
    () => (isManpower || hasFixedCategory ? ['74%', '92%'] : ['80%', '94%']),
    [isManpower, hasFixedCategory],
  );

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 350);
  const [workTypeFilter, setWorkTypeFilter] = useState<
    'ALL' | ManpowerWorkType
  >('ALL');

  const [category, setCategory] = useState<ExpenseCategory>(
    categoryCode || (isManpower ? 'LABOUR_WAGES' : 'RENT_UTILITIES'),
  );
  const [title, setTitle] = useState('');
  const [amountText, setAmountText] = useState('');
  const [workType, setWorkType] = useState<ManpowerWorkType>('CONTRACT');
  const [workItem, setWorkItem] = useState('');
  const [unitsText, setUnitsText] = useState('');
  const [rateText, setRateText] = useState('');
  const [expenseDate, setExpenseDate] = useState<string>(todayIsoDate);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseItem | null>(null);

  const now = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState<{
    year: number;
    month: number | null;
  } | null>(() => ({ year: now.getFullYear(), month: now.getMonth() + 1 }));
  const [pickerYear, setPickerYear] = useState<number>(() =>
    now.getFullYear(),
  );
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const monthRange = useMemo(
    () =>
      selectedMonth
        ? getMonthRange(selectedMonth.year, selectedMonth.month)
        : null,
    [selectedMonth],
  );
  const periodLabel = monthRange?.label ?? 'All Time';

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerCalBtn}
          activeOpacity={0.75}
          onPress={() => {
            setPickerYear(selectedMonth?.year ?? now.getFullYear());
            setFilterModalOpen(true);
          }}
        >
          <Calendar size={17} color={colors.primary} />
          <Text style={styles.headerCalText}>{periodLabel}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, periodLabel, selectedMonth, now]);

  const effectiveCategory = isManpower ? 'LABOUR_WAGES' : categoryCode;
  const activeWorkType =
    isManpower && !isDetailMode && workTypeFilter !== 'ALL'
      ? workTypeFilter
      : undefined;

  const titlesQuery = useInfiniteExpenseTitles(
    debouncedSearch || undefined,
    effectiveCategory,
    !isDetailMode,
    monthRange?.startDate,
    monthRange?.endDate,
    15,
    activeWorkType,
  );

  const expensesQuery = useInfiniteExpenses(
    undefined,
    effectiveCategory,
    titleFilter,
    monthRange?.startDate,
    monthRange?.endDate,
    isDetailMode,
  );

  const activeQuery = isDetailMode ? expensesQuery : titlesQuery;
  const {
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = activeQuery;

  const { mutate: createExpense, isPending: isCreating } = useCreateExpense();
  const { mutate: updateExpense, isPending: isUpdating } = useUpdateExpense();
  const { mutate: deleteExpense, isPending: isDeleting } = useDeleteExpense();
  const isSaving = isCreating || isUpdating;

  const items = useMemo(() => {
    if (!isDetailMode) return [];
    return expensesQuery.data?.pages.flatMap((p) => p.items) ?? [];
  }, [expensesQuery.data, isDetailMode]);

  const groupedItems = useMemo(() => {
    if (isDetailMode) return [];
    return titlesQuery.data?.pages.flatMap((p) => p.items) ?? [];
  }, [titlesQuery.data, isDetailMode]);

  const lastTitleSummaryRef = useRef<{
    totalAmount: number;
    totalPaid?: number;
    totalPending?: number;
    totalEntries: number;
    totalItems: number;
    thisMonthAmount?: number;
    topItem?: { title: string; totalAmount: number } | null;
    availableWorkTypes?: ManpowerWorkType[];
  } | null>(null);
  const lastSummaryContextRef = useRef<string>('');
  const summaryContextKey = `${periodLabel}::${workTypeFilter}`;
  if (lastSummaryContextRef.current !== summaryContextKey) {
    lastSummaryContextRef.current = summaryContextKey;
    lastTitleSummaryRef.current = null;
  }
  if (!isDetailMode && titlesQuery.data?.pages?.[0]?.summary) {
    lastTitleSummaryRef.current = titlesQuery.data.pages[0].summary;
  }
  const titleSummary =
    titlesQuery.data?.pages?.[0]?.summary ?? lastTitleSummaryRef.current;

  const visibleWorkTypeFilters = useMemo(() => {
    const avail = titleSummary?.availableWorkTypes ?? [];
    if (avail.length === 0) return [];
    return WORK_TYPE_FILTERS.filter(
      (f) => f.value === 'ALL' || avail.includes(f.value),
    );
  }, [titleSummary?.availableWorkTypes]);

  const hasOverviewData = isDetailMode
    ? Boolean(expensesQuery.data?.pages?.[0])
    : Boolean(titleSummary);

  const totalAmount = useMemo(() => {
    if (isDetailMode) {
      return (
        expensesQuery.data?.pages?.[0]?.totals?.totalAmount ??
        items.reduce(
          (sum, it) => sum + Number(it.totalAmount ?? it.amount ?? 0),
          0,
        )
      );
    }
    return titleSummary?.totalAmount ?? 0;
  }, [isDetailMode, expensesQuery.data, titleSummary, items]);

  const totalPaid = isDetailMode
    ? expensesQuery.data?.pages?.[0]?.totals?.paidAmount ?? totalAmount
    : titleSummary?.totalPaid ?? totalAmount;

  const totalPending = isDetailMode
    ? expensesQuery.data?.pages?.[0]?.totals?.pendingAmount ?? 0
    : titleSummary?.totalPending ?? 0;

  const totalEntries = isDetailMode
    ? expensesQuery.data?.pages?.[0]?.pagination?.total ?? items.length
    : titleSummary?.totalEntries ?? 0;

  const totalItemsCount =
    titleSummary?.totalItems ?? groupedItems.length;

  const parsedUnits = Number.parseFloat(unitsText) || 0;
  const parsedRate = Number.parseFloat(rateText) || 0;
  const computedManpowerTotal =
    isManpower && (workType === 'CONTRACT' || workType === 'DAILY_WAGE')
      ? parsedUnits > 0 && parsedRate > 0
        ? Math.round(parsedUnits * parsedRate * 100) / 100
        : Number.parseFloat(amountText) || 0
      : Number.parseFloat(amountText) || 0;

  const effectiveLockedWorkType =
    editingItem?.manpowerDetails?.workType ??
    (isDetailMode
      ? items.find((it) => it.manpowerDetails?.workType)?.manpowerDetails
          ?.workType ?? lockedWorkType
      : undefined);
  const isWorkTypeLocked = Boolean(effectiveLockedWorkType);

  const resetForm = () => {
    setEditingItem(null);
    setCategory(categoryCode || (isManpower ? 'LABOUR_WAGES' : 'RENT_UTILITIES'));
    setTitle(titleFilter || '');
    setAmountText('');
    setWorkType(
      effectiveLockedWorkType ??
        (workTypeFilter !== 'ALL' ? workTypeFilter : 'CONTRACT'),
    );
    setWorkItem('');
    setUnitsText('');
    setRateText('');
    setExpenseDate(todayIsoDate());
    setCalendarOpen(false);
    setNotes('');
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.45}
        pressBehavior={isSaving ? 'none' : 'close'}
      />
    ),
    [isSaving],
  );

  const handleOpenAdd = () => {
    resetForm();
    addSheetRef.current?.present();
  };

  const handleOpenEdit = (item: ExpenseItem) => {
    setEditingItem(item);
    setCategory(item.category);
    setTitle(item.title || '');
    setAmountText(String(item.amount ?? item.totalAmount ?? ''));
    const md = item.manpowerDetails;
    if (md?.workType) {
      setWorkType(md.workType);
      setWorkItem(md.workItem || '');
      setUnitsText(md.units ? String(md.units) : '');
      setRateText(md.ratePerUnit ? String(md.ratePerUnit) : '');
    } else {
      setWorkType('CONTRACT');
      setWorkItem('');
      setUnitsText('');
      setRateText('');
    }
    const parsed = item.expenseDate ? new Date(item.expenseDate) : null;
    if (parsed && !Number.isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      setExpenseDate(`${y}-${m}-${d}`);
    } else {
      setExpenseDate(todayIsoDate());
    }
    setCalendarOpen(false);
    setNotes(item.notes || '');
    addSheetRef.current?.present();
  };

  const handleCloseAdd = () => {
    if (isSaving) return;
    addSheetRef.current?.dismiss();
  };

  const handleMarkPaid = (item: ExpenseItem) => {
    if (isSaving) return;
    const total = Number(item.totalAmount ?? item.amount ?? 0);
    const md = item.manpowerDetails;
    updateExpense(
      {
        id: item._id,
        payload: {
          manpowerDetails: {
            workType: md?.workType || 'CONTRACT',
            workItem: md?.workItem || '',
            units: md?.units || 0,
            ratePerUnit: md?.ratePerUnit || 0,
            paidAmount: total,
          },
        },
      },
      {
        onSuccess: () => {
          popup.success('Settled', 'Marked as fully paid.');
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<{ message?: string }>;
          popup.error(
            'Update Failed',
            axiosErr.response?.data?.message || 'Unable to settle payment.',
          );
        },
      },
    );
  };

  const handleSave = () => {
    if (isSaving) return;
    const trimmedTitle = title.trim();
    const amount = isManpower
      ? computedManpowerTotal
      : Number.parseFloat(amountText);
    if (!trimmedTitle) {
      popup.error(
        'Required',
        isManpower ? 'Worker / contractor name is required.' : 'Expense title is required.',
      );
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      popup.error(
        'Invalid Amount',
        isManpower && (workType === 'CONTRACT' || workType === 'DAILY_WAGE')
          ? 'Please enter valid units and rate greater than 0.'
          : 'Please enter an amount greater than 0.',
      );
      return;
    }

    const payload = {
      category: categoryCode || (isManpower ? 'LABOUR_WAGES' : category),
      title: trimmedTitle,
      amount,
      expenseDate,
      notes: notes.trim(),
      ...(isManpower
        ? {
            manpowerDetails: {
              workType,
              workItem: workItem.trim(),
              units: workType === 'SALARY' ? 1 : parsedUnits,
              ratePerUnit: workType === 'SALARY' ? amount : parsedRate,
              paidAmount: amount,
            },
          }
        : {}),
    };

    if (editingItem) {
      updateExpense(
        { id: editingItem._id, payload },
        {
          onSuccess: () => {
            addSheetRef.current?.dismiss();
            resetForm();
            popup.success('Updated', 'Expense updated successfully.');
          },
          onError: (err) => {
            const axiosErr = err as AxiosError<{ message?: string }>;
            popup.error(
              'Update Failed',
              axiosErr.response?.data?.message || 'Unable to update expense.',
            );
          },
        },
      );
      return;
    }

    createExpense(payload, {
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
    });
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

  const renderOverviewCard = () => {
    if (isLoading && !hasOverviewData) {
      return (
        <View style={[styles.overviewCard, styles.overviewScrollSpacing]}>
          <View style={styles.overviewHeaderRow}>
            <View>
              <SkeletonBox width={108} height={11} />
              <SkeletonBox width={128} height={16} style={styles.mt6} />
            </View>
            <SkeletonBox width={78} height={24} borderRadius={radius.full} />
          </View>
          <View style={styles.metricsRow}>
            {[0, 1, 2].map((k) => (
              <View key={k} style={styles.metricTile}>
                <SkeletonBox width="65%" height={11} />
                <SkeletonBox width="55%" height={16} style={styles.mt6} />
              </View>
            ))}
          </View>
        </View>
      );
    }

    const headingText =
      titleFilter ||
      categoryName ||
      (isManpower ? 'Manpower Summary' : 'Category Summary');
    const eyebrowText = isDetailMode
      ? 'ITEM OVERVIEW'
      : isManpower
        ? 'MANPOWER OVERVIEW'
        : 'CATEGORY OVERVIEW';

    return (
      <TouchableOpacity
        style={[styles.overviewCard, styles.overviewScrollSpacing]}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('ExpensesOverviewDetail', {
            mode,
            categoryCode,
            categoryName,
            titleFilter,
          })
        }
      >
        <View style={styles.overviewHeaderRow}>
          <View style={styles.overviewTitleWrap}>
            <Text style={styles.eyebrow}>{eyebrowText}</Text>
            <Text style={styles.overviewHeading} numberOfLines={1}>
              {headingText}
            </Text>
          </View>
          <View style={styles.overviewHeaderRight}>
            <View style={styles.entriesBadge}>
              <Text style={styles.entriesBadgeText}>
                {isDetailMode
                  ? periodLabel
                  : `${totalEntries.toLocaleString('en-IN')} ${totalEntries === 1 ? 'Entry' : 'Entries'}`}
              </Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricTile}>
            <View style={styles.metricLabelRow}>
              <IndianRupee size={12} color={colors.primary} />
              <Text style={styles.metricLabel}>
                {isDetailMode ? 'Spend' : 'Total Spend'}
              </Text>
            </View>
            <Text style={styles.metricVal} numberOfLines={1}>
              {fmtMoney(totalAmount)}
            </Text>
          </View>

          <View style={styles.metricTile}>
            <View style={styles.metricLabelRow}>
              <Layers size={12} color={colors.primary} />
              <Text style={styles.metricLabel}>
                {isDetailMode
                  ? isManpower
                    ? 'Paid'
                    : 'Entries'
                  : isManpower
                    ? 'Workers'
                    : 'Items'}
              </Text>
            </View>
            <Text style={styles.metricVal} numberOfLines={1}>
              {isDetailMode
                ? isManpower
                  ? fmtMoney(totalPaid)
                  : totalEntries
                : totalItemsCount}
            </Text>
          </View>

          <View style={styles.metricTile}>
            <View style={styles.metricLabelRow}>
              <Hash size={12} color={colors.primary} />
              <Text style={styles.metricLabel}>
                {isDetailMode
                  ? isManpower
                    ? 'Pending'
                    : 'Avg / Entry'
                  : isManpower
                    ? 'Pending'
                    : 'This Month'}
              </Text>
            </View>
            <Text
              style={[
                styles.metricVal,
                isManpower && totalPending > 0 && styles.pendingMetricVal,
              ]}
              numberOfLines={1}
            >
              {isDetailMode
                ? isManpower
                  ? fmtMoney(totalPending)
                  : fmtMoney(totalEntries > 0 ? totalAmount / totalEntries : 0)
                : isManpower
                  ? fmtMoney(totalPending)
                  : fmtMoney(titleSummary?.thisMonthAmount)}
            </Text>
          </View>
        </View>

        {!isDetailMode && isManpower ? (
          <View style={styles.statusRow}>
            <View style={styles.statusChip}>
              <View style={styles.topDot} />
              <Text style={styles.statusText} numberOfLines={1}>
                Paid: {fmtMoney(totalPaid)} • This Month:{' '}
                {fmtMoney(titleSummary?.thisMonthAmount)}
              </Text>
            </View>
          </View>
        ) : !isDetailMode && titleSummary?.topItem ? (
          <View style={styles.statusRow}>
            <View style={styles.statusChip}>
              <View style={styles.topDot} />
              <Text style={styles.statusText} numberOfLines={1}>
                Top Spend: {titleSummary.topItem.title} (
                {fmtMoney(titleSummary.topItem.totalAmount)})
              </Text>
            </View>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      {!isDetailMode ? (
        <View style={styles.topBar}>
          <View style={styles.searchBox}>
            <Search size={16} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder={
                isManpower ? 'Search worker / contractor...' : 'Search expense...'
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
          {isManpower && visibleWorkTypeFilters.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipsRow}
            >
              {visibleWorkTypeFilters.map((f) => {
                const active = workTypeFilter === f.value;
                return (
                  <TouchableOpacity
                    key={f.value}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setWorkTypeFilter(f.value)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}
        </View>
      ) : null}

      {isLoading && (isDetailMode ? items.length === 0 : groupedItems.length === 0) ? (
        <View style={styles.initialLoadingWrap}>
          <View style={styles.initialOverviewPad}>{renderOverviewCard()}</View>
          <ExpenseListSkeleton />
        </View>
      ) : isDetailMode ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderOverviewCard}
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
              <Text style={styles.emptyTitle}>No Entries Yet</Text>
              <Text style={styles.emptySub}>
                Tap + to add an entry for {titleFilter}.
              </Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? <ExpenseFooterSkeleton /> : undefined
          }
          renderItem={({ item }) => {
            const md = item.manpowerDetails;
            const pendingAmt = Number(md?.pendingAmount || 0);
            const paidAmt = Number(
              md?.paidAmount ?? (item.totalAmount ?? item.amount ?? 0),
            );
            const workLabel = md?.workType
              ? WORK_TYPE_LABELS[md.workType]
              : null;
            const hasCalc =
              md &&
              Number(md.units || 0) > 0 &&
              Number(md.ratePerUnit || 0) > 0 &&
              md.workType !== 'SALARY';

            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={styles.badgeWrapRow}>
                      {workLabel ? (
                        <View style={styles.workTypePill}>
                          <Text style={styles.workTypePillText}>
                            {workLabel}
                          </Text>
                        </View>
                      ) : null}
                      <View style={styles.dateBadge}>
                        <Calendar size={12} color={colors.primary} />
                        <Text style={styles.dateText}>
                          {fmtDate(item.expenseDate)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.amountPill}>
                    <Text style={styles.amountText}>
                      {fmtMoney(item.totalAmount ?? item.amount)}
                    </Text>
                  </View>
                </View>

                {md?.workItem || hasCalc ? (
                  <View style={styles.manpowerCalcRow}>
                    {md?.workItem ? (
                      <Text style={styles.manpowerWorkItem} numberOfLines={1}>
                        {md.workItem}
                      </Text>
                    ) : null}
                    {hasCalc ? (
                      <Text style={styles.manpowerFormula}>
                        {md.units} {md.workType === 'DAILY_WAGE' ? 'days' : 'units'} ×{' '}
                        {fmtMoney(md.ratePerUnit)}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {pendingAmt > 0 ? (
                  <View style={styles.paymentStatusRow}>
                    <View style={styles.paidBadge}>
                      <Text style={styles.paidBadgeText}>
                        Paid: {fmtMoney(paidAmt)}
                      </Text>
                    </View>
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>
                        Pending: {fmtMoney(pendingAmt)}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {item.notes ? (
                  <Text style={styles.notesText} numberOfLines={2}>
                    {item.notes}
                  </Text>
                ) : null}

                <View style={styles.cardActionsBar}>
                  {pendingAmt > 0 ? (
                    <TouchableOpacity
                      onPress={() => handleMarkPaid(item)}
                      activeOpacity={0.75}
                      style={styles.settleActionBtn}
                      disabled={isSaving}
                    >
                      <CheckCircle2 size={13} color={colors.success} />
                      <Text style={styles.settleActionText}>Mark Paid</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    onPress={() => handleOpenEdit(item)}
                    activeOpacity={0.75}
                    style={styles.editActionBtn}
                  >
                    <Pencil size={13} color={colors.primary} />
                    <Text style={styles.editActionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setDeleteTarget(item)}
                    activeOpacity={0.75}
                    style={styles.deleteActionBtn}
                  >
                    <Trash2 size={13} color={colors.danger} />
                    <Text style={styles.deleteActionText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      ) : (
        <FlatList
          data={groupedItems}
          keyExtractor={(group) => group.key}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderOverviewCard}
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
            isFetchingNextPage ? <ExpenseFooterSkeleton /> : undefined
          }
          renderItem={({ item: group }) => (
            <TouchableOpacity
              style={styles.groupListRow}
              activeOpacity={0.75}
              onPress={() =>
                navigation.navigate('ExpenseTitleDetail', {
                  title: group.title,
                  mode,
                  categoryCode,
                  categoryName,
                  lockedWorkType: group.workTypes?.[0],
                })
              }
            >
              <View style={styles.groupIconBox}>
                {isManpower ? (
                  <Users size={18} color={colors.primary} />
                ) : (
                  <Receipt size={18} color={colors.primary} />
                )}
              </View>
              <View style={styles.groupListInfo}>
                <Text style={styles.groupListTitle} numberOfLines={1}>
                  {group.title}
                </Text>
                <View style={styles.groupSubRow}>
                  <Text style={styles.groupEntryCount}>
                    {group.count} {group.count === 1 ? 'entry' : 'entries'}
                  </Text>
                  {isManpower &&
                    (group.workTypes ?? []).map((wt) => (
                      <View key={wt} style={styles.workTypePill}>
                        <Text style={styles.workTypePillText}>
                          {WORK_TYPE_LABELS[wt] || wt}
                        </Text>
                      </View>
                    ))}
                  {isManpower && (group.totalPending ?? 0) > 0 ? (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>
                        Pending {fmtMoney(group.totalPending)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <View style={styles.groupRightWrap}>
                <Text style={styles.groupAmountText} numberOfLines={1}>
                  {fmtMoney(group.totalAmount)}
                </Text>
                <ChevronRight size={18} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={handleOpenAdd}
      >
        <Plus size={24} color={colors.surface} />
      </TouchableOpacity>

      {/* Add / Edit Expense Bottom Sheet */}
      <BottomSheetModal
        ref={addSheetRef}
        index={0}
        snapPoints={snapPoints}
        topInset={insets.top}
        enablePanDownToClose={!isSaving}
        enableHandlePanningGesture={!isSaving}
        enableContentPanningGesture={!isSaving}
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
                {editingItem
                  ? isManpower
                    ? 'Edit Manpower Expense'
                    : 'Edit Expense'
                  : isManpower
                    ? 'Add Manpower Expense'
                    : 'Add Expense'}
              </Text>
              <Text style={styles.sheetSubtitle}>
                {categoryName
                  ? `${editingItem ? 'Editing in' : 'Adding to'} ${categoryName}`
                  : isManpower
                    ? 'Record daily wages & labour cost'
                    : 'Record operational expense'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleCloseAdd}
            disabled={isSaving}
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
          {!isManpower && !hasFixedCategory ? (
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

          {isManpower ? (
            <View style={styles.sectionBlock}>
              <Text style={styles.fieldLabel}>
                Work Type <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.chipGrid}>
                {WORK_TYPE_OPTIONS.map((opt) => {
                  const active = workType === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.chip,
                        active && styles.chipActive,
                        isWorkTypeLocked && !active && styles.chipDisabled,
                      ]}
                      onPress={() => {
                        if (isWorkTypeLocked && !active && effectiveLockedWorkType) {
                          popup.error(
                            'Work Type Locked',
                            `"${title.trim() || 'This worker'}" is already created as ${WORK_TYPE_LABELS[effectiveLockedWorkType]}. You cannot change it to ${WORK_TYPE_LABELS[opt.value]} — please create a new name for a different type.`,
                          );
                          return;
                        }
                        setWorkType(opt.value);
                      }}
                      activeOpacity={0.75}
                      disabled={isSaving}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={styles.sectionBlock}>
            <Text style={styles.fieldLabel}>
              {isManpower ? 'Worker / Contractor Name' : 'Title'}{' '}
              <Text style={styles.requiredStar}>*</Text>
            </Text>
            <BottomSheetTextInput
              style={[styles.input, isDetailMode && styles.inputLocked]}
              placeholder={
                isManpower
                  ? 'e.g. Ramesh Kumar'
                  : 'e.g. Shop rent / Electricity bill'
              }
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              editable={!isSaving && !isDetailMode}
            />
          </View>

          {isManpower ? (
            <>
              <View style={styles.sectionBlock}>
                <Text style={styles.fieldLabel}>
                  {workType === 'SALARY'
                    ? 'Role / Designation'
                    : workType === 'CONTRACT'
                      ? 'Work / Item Name'
                      : 'Work / Task'}
                </Text>
                <BottomSheetTextInput
                  style={styles.input}
                  placeholder={
                    workType === 'SALARY'
                      ? 'e.g. Supervisor, Driver'
                      : workType === 'CONTRACT'
                        ? 'e.g. Box Packing, Stitching'
                        : 'e.g. Loading, Helper'
                  }
                  placeholderTextColor={colors.textMuted}
                  value={workItem}
                  onChangeText={setWorkItem}
                  editable={!isSaving}
                />
              </View>

              {workType === 'CONTRACT' || workType === 'DAILY_WAGE' ? (
                <View style={styles.twoColRow}>
                  <View style={[styles.sectionBlock, styles.twoColItem]}>
                    <Text style={styles.fieldLabel}>
                      {workType === 'DAILY_WAGE' ? 'Days' : 'Units / Qty'}{' '}
                      <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <BottomSheetTextInput
                      style={styles.input}
                      placeholder={workType === 'DAILY_WAGE' ? 'e.g. 15' : 'e.g. 500'}
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                      value={unitsText}
                      onChangeText={setUnitsText}
                      editable={!isSaving}
                    />
                  </View>

                  <View style={[styles.sectionBlock, styles.twoColItem]}>
                    <Text style={styles.fieldLabel}>
                      {workType === 'DAILY_WAGE' ? 'Daily Rate (₹)' : 'Rate / Unit (₹)'}{' '}
                      <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <BottomSheetTextInput
                      style={styles.input}
                      placeholder={workType === 'DAILY_WAGE' ? 'e.g. 500' : 'e.g. 12'}
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                      value={rateText}
                      onChangeText={setRateText}
                      editable={!isSaving}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.sectionBlock}>
                  <Text style={styles.fieldLabel}>
                    Salary Amount (₹) <Text style={styles.requiredStar}>*</Text>
                  </Text>
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
                      editable={!isSaving}
                    />
                  </View>
                </View>
              )}

              {computedManpowerTotal > 0 ? (
                <View style={styles.calcBanner}>
                  <View style={styles.calcBannerCol}>
                    <Text style={styles.calcBannerLabel}>Total Payable</Text>
                    <Text style={styles.calcBannerVal}>
                      {fmtMoney(computedManpowerTotal)}
                    </Text>
                  </View>
                </View>
              ) : null}
            </>
          ) : (
            <View style={styles.sectionBlock}>
              <Text style={styles.fieldLabel}>
                Amount (₹) <Text style={styles.requiredStar}>*</Text>
              </Text>
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
                  editable={!isSaving}
                />
              </View>
            </View>
          )}

          <View style={styles.sectionBlock}>
            <Text style={styles.fieldLabel}>Date</Text>
            <TouchableOpacity
              style={styles.dateSelector}
              activeOpacity={0.75}
              onPress={() => setCalendarOpen((prev) => !prev)}
              disabled={isCreating}
            >
              <View style={styles.dateSelectorLeft}>
                <Calendar size={17} color={colors.primary} />
                <Text style={styles.dateSelectorText}>
                  {fmtDate(expenseDate)}
                </Text>
              </View>
              <ChevronDown
                size={18}
                color={colors.textSecondary}
                style={calendarOpen ? styles.chevronRotated : undefined}
              />
            </TouchableOpacity>
            {calendarOpen ? (
              <View style={styles.calendarWrap}>
                <RNCalendar
                  current={expenseDate}
                  maxDate={todayIsoDate()}
                  onDayPress={(day) => {
                    setExpenseDate(day.dateString);
                    setCalendarOpen(false);
                  }}
                  markedDates={{
                    [expenseDate]: {
                      selected: true,
                      selectedColor: colors.primary,
                      selectedTextColor: colors.surface,
                    },
                  }}
                  theme={{
                    backgroundColor: colors.surface,
                    calendarBackground: colors.surface,
                    textSectionTitleColor: colors.textSecondary,
                    selectedDayBackgroundColor: colors.primary,
                    selectedDayTextColor: colors.surface,
                    todayTextColor: colors.primary,
                    dayTextColor: colors.textPrimary,
                    textDisabledColor: colors.textMuted,
                    arrowColor: colors.primary,
                    monthTextColor: colors.textPrimary,
                    textDayFontWeight: '500',
                    textMonthFontWeight: '700',
                    textDayHeaderFontWeight: '600',
                    textDayFontSize: 13,
                    textMonthFontSize: 15,
                    textDayHeaderFontSize: 12,
                  }}
                />
              </View>
            ) : null}
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.fieldLabel}>Description</Text>
            <BottomSheetTextInput
              style={[styles.input, styles.multiline]}
              placeholder="Add bill number, worker count, or details..."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              editable={!isCreating}
              multiline
            />
          </View>

          <View style={styles.saveWrap}>
            <AuthButton
              title={
                editingItem
                  ? 'Save Changes'
                  : isManpower
                    ? 'Save Manpower Expense'
                    : 'Save Expense'
              }
              onPress={handleSave}
              loading={isSaving}
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

      {/* Month Filter Modal (Detail Mode Header - Month & Year Only) */}
      <Modal
        visible={filterModalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setFilterModalOpen(false)}
      >
        <View style={styles.filterModalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setFilterModalOpen(false)}
          />
          <View style={styles.filterModalCard}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Select Month</Text>
              <TouchableOpacity
                onPress={() => setFilterModalOpen(false)}
                hitSlop={8}
                style={styles.closeBtn}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.yearSwitchRow}>
              <TouchableOpacity
                style={styles.yearArrowBtn}
                onPress={() => setPickerYear((y) => y - 1)}
                activeOpacity={0.75}
              >
                <ChevronLeft size={18} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.yearText}>{pickerYear}</Text>
              {pickerYear < now.getFullYear() ? (
                <TouchableOpacity
                  style={styles.yearArrowBtn}
                  onPress={() => setPickerYear((y) => y + 1)}
                  activeOpacity={0.75}
                >
                  <ChevronRight size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              ) : (
                <View style={styles.yearArrowPlaceholder} />
              )}
            </View>

            <View style={styles.monthGrid}>
              {MONTH_NAMES.map((mName, idx) => {
                const monthNum = idx + 1;
                if (
                  pickerYear > now.getFullYear() ||
                  (pickerYear === now.getFullYear() &&
                    monthNum > now.getMonth() + 1)
                ) {
                  return null;
                }
                const isSelected =
                  selectedMonth?.year === pickerYear &&
                  selectedMonth?.month === monthNum;
                const isCurrentMonth =
                  pickerYear === now.getFullYear() &&
                  monthNum === now.getMonth() + 1;
                return (
                  <TouchableOpacity
                    key={mName}
                    style={[
                      styles.monthCell,
                      isCurrentMonth && !isSelected && styles.monthCellCurrent,
                      isSelected && styles.monthCellActive,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => {
                      setSelectedMonth({ year: pickerYear, month: monthNum });
                      setFilterModalOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.monthCellText,
                        isCurrentMonth &&
                          !isSelected &&
                          styles.monthCellTextCurrent,
                        isSelected && styles.monthCellTextActive,
                      ]}
                    >
                      {mName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.footerActionsRow}>
              <TouchableOpacity
                style={[
                  styles.allTimeBtn,
                  styles.footerActionBtn,
                  selectedMonth?.year === pickerYear &&
                    selectedMonth?.month === null &&
                    styles.allTimeBtnActive,
                ]}
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedMonth({ year: pickerYear, month: null });
                  setFilterModalOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.allTimeBtnText,
                    selectedMonth?.year === pickerYear &&
                      selectedMonth?.month === null &&
                      styles.allTimeBtnTextActive,
                  ]}
                >
                  Full Year {pickerYear}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.allTimeBtn,
                  styles.footerActionBtn,
                  selectedMonth === null && styles.allTimeBtnActive,
                ]}
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedMonth(null);
                  setFilterModalOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.allTimeBtnText,
                    selectedMonth === null && styles.allTimeBtnTextActive,
                  ]}
                >
                  All Time
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  initialLoadingWrap: {
    flex: 1,
  },
  initialOverviewPad: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  overviewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  overviewScrollSpacing: {
    marginBottom: spacing.xs,
  },
  overviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  overviewTitleWrap: {
    flex: 1,
  },
  overviewHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 0.7,
  },
  overviewHeading: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 1,
  },
  entriesBadge: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  entriesBadgeText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginTop: spacing.sm + 2,
  },
  metricTile: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  metricVal: {
    fontSize: fontSize.sm + 1,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm + 2,
  },
  statusChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  topDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  statusText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  mt6: {
    marginTop: 6,
  },
  pendingMetricVal: {
    color: colors.warning,
  },
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.sm + 2,
    paddingRight: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.surface,
  },
  groupListInfo: {
    flex: 1,
    gap: 4,
  },
  groupSubRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  badgeWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  workTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  workTypePillText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  manpowerCalcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    gap: spacing.sm,
  },
  manpowerWorkItem: {
    flex: 1,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  manpowerFormula: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  paymentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paidBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: '#ECFDF5',
  },
  paidBadgeText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: '#FEF3C7',
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: '#B45309',
  },
  settleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: '#ECFDF5',
  },
  settleActionText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  twoColItem: {
    flex: 1,
  },
  calcBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  calcBannerCol: {
    gap: 2,
  },
  calcBannerColRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  calcBannerLabel: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  calcBannerVal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
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
    gap: spacing.sm,
    ...shadows.card,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cardTitleWrap: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  dateText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  amountPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.card,
  },
  groupIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupListTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  groupEntryCount: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  groupRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupAmountText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  amountText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  notesText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  cardActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  editActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  editActionText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  deleteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.dangerBg,
  },
  deleteActionText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.danger,
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
  chipDisabled: {
    opacity: 0.45,
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
  inputLocked: {
    backgroundColor: colors.background,
    color: colors.textSecondary,
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
  requiredStar: {
    color: colors.danger,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  dateSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateSelectorText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  calendarWrap: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  saveWrap: {
    marginTop: spacing.sm,
  },
  headerCalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  headerCalText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  filterModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  filterModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.floating,
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  filterModalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  yearSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    marginTop: spacing.sm,
  },
  yearArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  yearArrowPlaceholder: {
    width: 34,
    height: 34,
  },
  yearText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.md,
  },
  monthCell: {
    width: '31%',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCellActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  monthCellCurrent: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  monthCellText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  monthCellTextCurrent: {
    color: colors.primary,
  },
  monthCellTextActive: {
    color: colors.surface,
  },
  filterModalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  filterResetBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterResetText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  footerActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footerActionBtn: {
    flex: 1,
  },
  allTimeBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allTimeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  allTimeBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  allTimeBtnTextActive: {
    color: colors.surface,
  },
});
