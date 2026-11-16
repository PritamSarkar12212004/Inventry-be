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
import { Check, ChevronDown, Plus, Search, User, X } from 'lucide-react-native';
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
import { useInfiniteSuppliers } from '../hooks';
import { inventoryStyles } from '../styles';
import type { SupplierItem } from '../types';

type SupplierPickerSheetProps = {
  supplierName: string;
  onSelectSupplier: (name: string, phone: string) => void;
};

export function SupplierPickerSheet({
  supplierName,
  onSelectSupplier,
}: SupplierPickerSheetProps) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search.trim(), 350);
  const snapPoints = useMemo(() => ['100%'], []);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteSuppliers(debouncedSearch || undefined);

  const suppliers = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const trimmedSearch = search.trim();
  const exactMatchExists = suppliers.some(
    (s) => s.name.toLowerCase() === trimmedSearch.toLowerCase(),
  );

  const handleOpen = () => {
    Keyboard.dismiss();
    sheetRef.current?.present();
  };

  const handleClose = () => {
    Keyboard.dismiss();
    sheetRef.current?.dismiss();
  };

  const handleSelectExisting = (item: SupplierItem) => {
    onSelectSupplier(item.name, item.phone);
    setSearch('');
    handleClose();
  };

  const handleUseNewName = () => {
    if (!trimmedSearch) return;
    onSelectSupplier(trimmedSearch, '');
    setSearch('');
    handleClose();
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
        {INVENTORY_COPY.form.supplierNameLabel}
      </Text>
      <TouchableOpacity
        style={inventoryStyles.selectorBox}
        onPress={handleOpen}
        activeOpacity={0.8}
      >
        <Text
          style={[
            inventoryStyles.selectorText,
            !supplierName && inventoryStyles.selectorPlaceholder,
          ]}
          numberOfLines={1}
        >
          {supplierName || INVENTORY_COPY.form.supplierNamePlaceholder}
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
            <Text style={styles.title}>Select Supplier</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Search size={18} color={colors.textMuted} />
            <BottomSheetTextInput
              style={styles.searchInput}
              placeholder="Search supplier or type new name..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {trimmedSearch && !exactMatchExists ? (
            <TouchableOpacity style={styles.addRow} onPress={handleUseNewName}>
              <Plus size={16} color={colors.primary} />
              <Text style={styles.addRowText}>
                Use &quot;{trimmedSearch}&quot; as new supplier
              </Text>
            </TouchableOpacity>
          ) : null}

          {isLoading ? (
            <View style={styles.centerBox}>
              <IosLoader size={24} color={colors.primary} />
            </View>
          ) : (
            <BottomSheetFlatList
              data={suppliers}
              keyExtractor={(item: SupplierItem) => item.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
              renderItem={({ item }: { item: SupplierItem }) => {
                const isSelected =
                  item.name.toLowerCase() === supplierName.toLowerCase();
                return (
                  <TouchableOpacity
                    style={styles.itemRow}
                    onPress={() => handleSelectExisting(item)}
                  >
                    <View style={styles.avatarBox}>
                      <User size={18} color={colors.primary} />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text
                        style={[
                          styles.itemTitle,
                          isSelected && styles.itemTitleActive,
                        ]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text style={styles.itemMeta}>+91 {item.phone}</Text>
                    </View>
                    {isSelected ? (
                      <Check size={18} color={colors.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
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
                <Text style={styles.emptyText}>
                  No suppliers found. Type a name above to add one.
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
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  itemTitleActive: {
    color: colors.primary,
  },
  itemMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.textMuted,
    paddingVertical: spacing.xl,
  },
});
