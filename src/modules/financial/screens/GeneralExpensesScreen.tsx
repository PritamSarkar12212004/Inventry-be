import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
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
  ChevronLeft,
  ChevronRight,
  FolderPlus,
  IndianRupee,
  Layers,
  Plus,
  Receipt,
  Search,
  X,
} from 'lucide-react-native';
import type { AxiosError } from 'axios';
import type { RootStackParamList } from '../../../core/navigation/types';
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
  useCreateExpenseCategory,
  useInfiniteExpenseCategories,
} from '../hooks';
import {
  ExpenseFooterSkeleton,
  ExpenseListSkeleton,
} from '../skeletons';
import type { ExpenseCategoryOverview } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

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

function fmtMoney(val?: number): string {
  return `₹${Number(val || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;
}

export function GeneralExpensesScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const addSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['38%', '55%'], []);

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
          <Calendar size={17} color={colors.textPrimary} />
          <Text style={styles.headerCalText}>{periodLabel}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, periodLabel, selectedMonth, now]);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 350);
  const [name, setName] = useState('');

  const {
    data,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteExpenseCategories(
    debouncedSearch || undefined,
    monthRange?.startDate,
    monthRange?.endDate,
  );
  const { mutate: createCategory, isPending: isCreating } =
    useCreateExpenseCategory();

  const categories = useMemo(() => {
    const all = data?.pages.flatMap((p) => p.items) ?? [];
    if (!selectedMonth) return all;
    return all.filter((cat) => Number(cat.expenseCount || 0) > 0);
  }, [data, selectedMonth]);
  const lastOverviewRef = useRef<ExpenseCategoryOverview | undefined>(undefined);
  const lastOverviewMonthKeyRef = useRef<string>('ALL');
  const currentMonthKey = selectedMonth
    ? `${selectedMonth.year}-${selectedMonth.month}`
    : 'ALL';
  if (lastOverviewMonthKeyRef.current !== currentMonthKey) {
    lastOverviewMonthKeyRef.current = currentMonthKey;
    lastOverviewRef.current = undefined;
  }
  if (data?.pages?.[0]?.overview) {
    lastOverviewRef.current = data.pages[0].overview;
  }
  const overview = data?.pages?.[0]?.overview ?? lastOverviewRef.current;
  const totalCount =
    overview?.totalCategories ??
    data?.pages?.[0]?.pagination?.total ??
    categories.length;

  const resetForm = () => {
    setName('');
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.45}
        pressBehavior={isCreating ? 'none' : 'close'}
      />
    ),
    [isCreating],
  );

  const handleOpenAdd = () => {
    resetForm();
    addSheetRef.current?.present();
  };

  const handleCloseAdd = () => {
    if (isCreating) return;
    addSheetRef.current?.dismiss();
  };

  const handleCreate = () => {
    if (isCreating) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      popup.error('Required', 'Category name is required.');
      return;
    }

    createCategory(
      {
        name: trimmedName,
      },
      {
        onSuccess: () => {
          addSheetRef.current?.dismiss();
          resetForm();
          popup.success('Created', 'Expense category added.');
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<{ message?: string }>;
          popup.error(
            'Save Failed',
            axiosErr.response?.data?.message || 'Unable to create category.',
          );
        },
      },
    );
  };

  const renderOverviewCard = () => {
    if (isLoading && !overview) {
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
          <View style={styles.statusRow}>
            <SkeletonBox width="100%" height={28} borderRadius={radius.sm} />
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.overviewCard, styles.overviewScrollSpacing]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('GeneralExpensesOverview')}
      >
        <View style={styles.overviewHeaderRow}>
          <View>
            <Text style={styles.eyebrow}>EXPENSES OVERVIEW</Text>
            <Text style={styles.overviewHeading}>General Summary</Text>
          </View>
          <View style={styles.overviewHeaderRight}>
            <View style={styles.entriesBadge}>
              <Text style={styles.entriesBadgeText}>
                {(overview?.totalEntries ?? 0).toLocaleString('en-IN')}{' '}
                {overview?.totalEntries === 1 ? 'Entry' : 'Entries'}
              </Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricTile}>
            <View style={styles.metricLabelRow}>
              <IndianRupee size={12} color={colors.primary} />
              <Text style={styles.metricLabel}>Total Spend</Text>
            </View>
            <Text style={styles.metricVal} numberOfLines={1}>
              {fmtMoney(overview?.totalExpenses)}
            </Text>
          </View>

          <View style={styles.metricTile}>
            <View style={styles.metricLabelRow}>
              <Layers size={12} color={colors.primary} />
              <Text style={styles.metricLabel}>Categories</Text>
            </View>
            <Text style={styles.metricVal}>{totalCount}</Text>
          </View>

          <View style={styles.metricTile}>
            <View style={styles.metricLabelRow}>
              <Calendar size={12} color={colors.primary} />
              <Text style={styles.metricLabel}>This Month</Text>
            </View>
            <Text style={styles.metricVal} numberOfLines={1}>
              {fmtMoney(overview?.thisMonthAmount)}
            </Text>
          </View>
        </View>

        {overview?.topCategory ? (
          <View style={styles.statusRow}>
            <View style={styles.statusChip}>
              <View style={styles.topDot} />
              <Text style={styles.statusText} numberOfLines={1}>
                Top Spend: {overview.topCategory.name} (
                {fmtMoney(overview.topCategory.totalAmount)})
              </Text>
            </View>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search category..."
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

      {isLoading && categories.length === 0 ? (
        <View style={styles.initialLoadingWrap}>
          <View style={styles.initialOverviewPad}>{renderOverviewCard()}</View>
          <ExpenseListSkeleton />
        </View>
      ) : (
        <FlatList
          data={categories}
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
              <Text style={styles.emptyTitle}>No Categories Yet</Text>
              <Text style={styles.emptySub}>
                Tap + to create your first expense category.
              </Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? <ExpenseFooterSkeleton /> : undefined
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.78}
              onPress={() =>
                navigation.navigate('CategoryExpenses', {
                  categoryCode: item.code,
                  categoryName: item.name,
                })
              }
            >
              <View style={styles.cardLeft}>
                <View style={styles.catIconBox}>
                  <Receipt size={18} color={colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {item.titleCount ?? 0}{' '}
                    {(item.titleCount ?? 0) === 1 ? 'item' : 'items'}
                  </Text>
                </View>
              </View>

              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Floating Add Category Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={handleOpenAdd}
      >
        <Plus size={24} color={colors.surface} />
      </TouchableOpacity>

      {/* Create Category Bottom Sheet */}
      <BottomSheetModal
        ref={addSheetRef}
        index={0}
        snapPoints={snapPoints}
        topInset={insets.top}
        enablePanDownToClose={!isCreating}
        enableHandlePanningGesture={!isCreating}
        enableContentPanningGesture={!isCreating}
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
              <FolderPlus size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.sheetTitle}>Create Category</Text>
              <Text style={styles.sheetSubtitle}>
                Add a new general expense category
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.closeBtn, isCreating && styles.closeBtnDisabled]}
            onPress={handleCloseAdd}
            disabled={isCreating}
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
          <View style={styles.sectionBlock}>
            <Text style={styles.fieldLabel}>
              Category Name <Text style={styles.requiredStar}>*</Text>
            </Text>
            <BottomSheetTextInput
              style={styles.input}
              placeholder="e.g. Office Rent, Electricity, Travel"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              editable={!isCreating}
            />
          </View>

          <View style={styles.saveWrap}>
            <AuthButton
              title="Save Category"
              onPress={handleCreate}
              loading={isCreating}
            />
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Month & Year Picker Modal */}
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
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
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
  initialLoadingWrap: {
    flex: 1,
  },
  initialOverviewPad: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  overviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 42,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 96,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  catIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  cardDesc: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardMeta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  amountText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  deleteBtn: {
    padding: 4,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
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
  closeBtnDisabled: {
    opacity: 0.4,
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
  requiredStar: {
    color: colors.danger,
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
  multiline: {
    minHeight: 78,
    textAlignVertical: 'top',
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
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.textPrimary,
  },
  headerCalText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
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
