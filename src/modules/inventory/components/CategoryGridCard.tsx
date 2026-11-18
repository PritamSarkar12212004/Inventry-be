import React, { memo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Check, Package } from 'lucide-react-native';
import { colors, fontSize, fontWeight, radius } from '../../../core/theme';
import { inventoryStyles } from '../styles';

export type CategorySummary = {
  name: string;
  coverImageUri: string | null;
  totalStock: number;
  productCount: number;
};

type CategoryGridCardProps = {
  category: CategorySummary;
  onPress: (categoryName: string) => void;
  onLongPress?: (categoryName: string) => void;
  selectionMode?: boolean;
  selectedCount?: number;
};

export const CategoryGridCard = memo(function CategoryGridCardComponent({
  category,
  onPress,
  onLongPress,
  selectionMode = false,
  selectedCount = 0,
}: CategoryGridCardProps) {
  const isAllSelected =
    category.productCount > 0 && selectedCount >= category.productCount;
  const isPartiallySelected = selectedCount > 0 && !isAllSelected;

  return (
    <TouchableOpacity
      style={[
        inventoryStyles.gridCard,
        selectedCount > 0 && localStyles.cardSelected,
      ]}
      onPress={() => onPress(category.name)}
      onLongPress={() => onLongPress?.(category.name)}
      delayLongPress={180}
      activeOpacity={0.85}
    >
      <View style={inventoryStyles.gridImageWrap}>
        {category.coverImageUri ? (
          <Image
            source={{ uri: category.coverImageUri }}
            style={inventoryStyles.gridImage}
            resizeMode="cover"
          />
        ) : (
          <Package size={32} color={colors.primary} />
        )}

        {selectionMode ? (
          <View
            style={[
              localStyles.checkBadge,
              (isAllSelected || isPartiallySelected) &&
                localStyles.checkBadgeActive,
            ]}
          >
            {isAllSelected ? (
              <Check size={13} color={colors.textInverse} strokeWidth={3} />
            ) : isPartiallySelected ? (
              <Text style={localStyles.partialText}>{selectedCount}</Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={inventoryStyles.gridBody}>
        <Text style={inventoryStyles.gridTitle} numberOfLines={1}>
          {category.name}
        </Text>
        <Text style={inventoryStyles.gridStockCount}>
          {category.totalStock} Stock
        </Text>
        <Text style={inventoryStyles.gridMeta}>
          {category.productCount}{' '}
          {category.productCount === 1 ? 'Product' : 'Products'}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const localStyles = StyleSheet.create({
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 4,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  partialText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
  },
});
