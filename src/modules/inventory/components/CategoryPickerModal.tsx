import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react-native';
import { IosLoader } from '../../../core/components/IosLoader';
import { useDebounce } from '../../../core/hooks/useDebounce';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
  touchTarget,
} from '../../../core/theme';
import { INVENTORY_COPY } from '../data';
import { useCategories, useCreateCategory } from '../hooks';
import { inventoryStyles } from '../styles';
import type { CategoryItem } from '../types';

type CategoryPickerModalProps = {
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
};

export function CategoryPickerModal({
  selectedCategory,
  onSelectCategory,
}: CategoryPickerModalProps) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 350);

  const snapPoints = useMemo(() => ['100%'], []);

  const { data: categories = [], isLoading } = useCategories(
    debouncedSearch || undefined,
  );
  const { mutate: createCategory, isPending: isCreating } = useCreateCategory();

  const trimmedSearch = search.trim();
  const exactMatchExists = categories.some(
    (c) => c.name.toLowerCase() === trimmedSearch.toLowerCase(),
  );

  const handleOpen = () => {
    Keyboard.dismiss();
    sheetRef.current?.present();
  };

  const handleClose = () => {
    Keyboard.dismiss();
    sheetRef.current?.dismiss();
  };

  const handleSelect = (name: string) => {
    onSelectCategory(name);
    setSearch('');
    handleClose();
  };

  const handleCreateAndSelect = () => {
    if (!trimmedSearch || isCreating) return;
    createCategory(trimmedSearch, {
      onSuccess: (res) => {
        handleSelect(res.data.name);
      },
    });
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.35}
      />
    ),
    [],
  );

  return (
    <View>
      <Text style={inventoryStyles.label}>
        {INVENTORY_COPY.form.categoryLabel}
      </Text>
      <TouchableOpacity
        style={inventoryStyles.selectorBox}
        onPress={handleOpen}
        activeOpacity={0.8}
      >
        <Text
          style={[
            inventoryStyles.selectorText,
            !selectedCategory && inventoryStyles.selectorPlaceholder,
          ]}
          numberOfLines={1}
        >
          {selectedCategory || INVENTORY_COPY.form.categoryPlaceholder}
        </Text>
        <ChevronDown size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <BottomSheetModal
        ref={sheetRef}
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
        <View style={[styles.sheetContent, { paddingBottom: insets.bottom }]}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {INVENTORY_COPY.form.categoryModalTitle}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Search size={18} color={colors.textMuted} />
            <BottomSheetTextInput
              style={styles.searchInput}
              placeholder={INVENTORY_COPY.form.categorySearchPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {trimmedSearch && !exactMatchExists ? (
            <TouchableOpacity
              style={styles.addRow}
              onPress={handleCreateAndSelect}
              disabled={isCreating}
            >
              {isCreating ? (
                <IosLoader size={16} color={colors.primary} />
              ) : (
                <Plus size={16} color={colors.primary} />
              )}
              <Text style={styles.addRowText}>
                Create &quot;{trimmedSearch}&quot;
              </Text>
            </TouchableOpacity>
          ) : null}

          {isLoading ? (
            <View style={styles.centerBox}>
              <IosLoader size={24} color={colors.primary} />
            </View>
          ) : (
            <BottomSheetFlatList
              data={categories}
              keyExtractor={(item: CategoryItem) => item.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
              renderItem={({ item }: { item: CategoryItem }) => {
                const isSelected =
                  item.name.toLowerCase() === selectedCategory.toLowerCase();
                return (
                  <TouchableOpacity
                    style={styles.itemRow}
                    onPress={() => handleSelect(item.name)}
                  >
                    <Text
                      style={[
                        styles.itemText,
                        isSelected && styles.itemTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {isSelected ? (
                      <Check size={18} color={colors.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No categories yet. Type above to create one.
                </Text>
              }
            />
          )}
        </View>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  handleIndicator: {
    backgroundColor: colors.border,
    width: 40,
  },
  sheetBg: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTarget.iconButton,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.sm,
  },
  addRowText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  centerBox: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  itemText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  itemTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.textMuted,
    paddingVertical: spacing.xl,
  },
});
