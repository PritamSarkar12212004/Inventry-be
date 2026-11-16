import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Image,
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
import { Check, ChevronDown, Package, Search, X } from 'lucide-react-native';
import { API_ORIGIN } from '../../../core/api';
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
import { useInventoryList } from '../hooks';
import { inventoryStyles } from '../styles';
import type { InventoryItem, ProductImageItem } from '../types';

type ProductPickerSheetProps = {
  selectedId: string;
  selectedName: string;
  onSelectProduct: (item: InventoryItem) => void;
};

function getThumbUri(images: ProductImageItem[]): string | null {
  if (!images || images.length === 0) return null;
  const primary =
    images.find((img) => typeof img !== 'string' && img.isPrimary) ?? images[0];
  const rawUrl = typeof primary === 'string' ? primary : primary?.url;
  if (!rawUrl) return null;
  return rawUrl.startsWith('http') ? rawUrl : `${API_ORIGIN}${rawUrl}`;
}

export function ProductPickerSheet({
  selectedId,
  selectedName,
  onSelectProduct,
}: ProductPickerSheetProps) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 350);

  const snapPoints = useMemo(() => ['100%'], []);

  const { data: products = [], isLoading } = useInventoryList({
    search: debouncedSearch || undefined,
    limit: 100,
    stockFilter: 'ALL',
  });

  const handleOpen = () => {
    Keyboard.dismiss();
    sheetRef.current?.present();
  };

  const handleClose = () => {
    Keyboard.dismiss();
    sheetRef.current?.dismiss();
  };

  const handleSelect = (item: InventoryItem) => {
    onSelectProduct(item);
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
        {INVENTORY_COPY.form.selectProductLabel}
      </Text>
      <TouchableOpacity
        style={inventoryStyles.selectorBox}
        onPress={handleOpen}
        activeOpacity={0.8}
      >
        <Text
          style={[
            inventoryStyles.selectorText,
            !selectedName && inventoryStyles.selectorPlaceholder,
          ]}
          numberOfLines={1}
        >
          {selectedName || INVENTORY_COPY.form.selectProductPlaceholder}
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
            <Text style={styles.title}>Select Product</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Search size={18} color={colors.textMuted} />
            <BottomSheetTextInput
              style={styles.searchInput}
              placeholder={INVENTORY_COPY.searchPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {isLoading ? (
            <View style={styles.centerBox}>
              <IosLoader size={24} color={colors.primary} />
            </View>
          ) : (
            <BottomSheetFlatList
              data={products}
              keyExtractor={(item: InventoryItem) => item.productId}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
              renderItem={({ item }: { item: InventoryItem }) => {
                const isSelected = item.productId === selectedId;
                const thumbUri = getThumbUri(item.images);

                return (
                  <TouchableOpacity
                    style={styles.itemRow}
                    onPress={() => handleSelect(item)}
                  >
                    <View style={styles.thumbBox}>
                      {thumbUri ? (
                        <Image
                          source={{ uri: thumbUri }}
                          style={styles.thumbImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <Package size={18} color={colors.primary} />
                      )}
                    </View>

                    <View style={styles.itemInfo}>
                      <Text
                        style={[
                          styles.itemTitle,
                          isSelected && styles.itemTitleActive,
                        ]}
                        numberOfLines={1}
                      >
                        {item.productName}
                      </Text>
                      <Text style={styles.itemMeta}>
                        {item.productCode} • {item.currentStock} {item.unit}
                      </Text>
                    </View>

                    {isSelected ? (
                      <Check size={18} color={colors.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No products found.</Text>
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
  thumbBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
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
