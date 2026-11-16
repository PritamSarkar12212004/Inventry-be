import React, { memo } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Package } from 'lucide-react-native';
import { colors } from '../../../core/theme';
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
};

export const CategoryGridCard = memo(function CategoryGridCardComponent({
  category,
  onPress,
}: CategoryGridCardProps) {
  return (
    <TouchableOpacity
      style={inventoryStyles.gridCard}
      onPress={() => onPress(category.name)}
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
