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
import { inventoryStyles } from '../../inventory/styles';
import { useInfiniteCustomers } from '../hooks';
import type { CustomerItem } from '../types';

type CustomerPickerSheetProps = {
  customerName: string;
  onSelectCustomer: (customer: {
    customerId: string | null;
    name: string;
    phone: string;
    address: string;
  }) => void;
};

export function CustomerPickerSheet({
  customerName,
  onSelectCustomer,
}: CustomerPickerSheetProps) {
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
  } = useInfiniteCustomers(debouncedSearch || undefined);

  const customers = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const trimmedSearch = search.trim();
  const exactMatchExists = customers.some(
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

  const handleSelectExisting = (item: CustomerItem) => {
    const resolvedAddress =
      item.billingAddress || item.shippingAddress || item.address || '';
    onSelectCustomer({
      customerId: item._id,
      name: item.name,
      phone: item.phone || '',
      address: resolvedAddress,
    });
    setSearch('');
    handleClose();
  };

  const handleUseNewName = () => {
    if (!trimmedSearch) return;
    onSelectCustomer({
      customerId: null,
      name: trimmedSearch,
      phone: '',
      address: '',
    });
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
      <Text style={inventoryStyles.label}>Customer Name *</Text>
      <TouchableOpacity
        style={inventoryStyles.selectorBox}
        onPress={handleOpen}
        activeOpacity={0.8}
      >
        <Text
          style={[
            inventoryStyles.selectorText,
            !customerName && inventoryStyles.selectorPlaceholder,
          ]}
          numberOfLines={1}
        >
          {customerName || 'Search or add customer...'}
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
            <Text style={styles.title}>Select Customer</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Search size={18} color={colors.textMuted} />
            <BottomSheetTextInput
              style={styles.searchInput}
              placeholder="Search customer or type new name..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {trimmedSearch && !exactMatchExists ? (
            <TouchableOpacity style={styles.addRow} onPress={handleUseNewName}>
              <Plus size={16} color={colors.primary} />
              <Text style={styles.addRowText}>
                Use &quot;{trimmedSearch}&quot; as new customer
              </Text>
            </TouchableOpacity>
          ) : null}

          {isLoading ? (
            <View style={styles.centerBox}>
              <IosLoader size={24} color={colors.primary} />
            </View>
          ) : (
            <BottomSheetFlatList
              data={customers}
              keyExtractor={(item: CustomerItem) => item._id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
              renderItem={({ item }: { item: CustomerItem }) => {
                const isSelected =
                  item.name.toLowerCase() === customerName.toLowerCase();
                const resolvedAddress =
                  item.billingAddress || item.shippingAddress || item.address;
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
                      <Text style={styles.itemMeta} numberOfLines={1}>
                        {item.phone ? item.phone : 'No phone'}
                        {resolvedAddress ? ` • ${resolvedAddress}` : ''}
                      </Text>
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
                  No customers found. Type a name above to add one.
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
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
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: touchTarget.minHeight,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  addRowText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.md,
  },
  avatarBox: {
    width: 38,
    height: 38,
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
