import React, { memo } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Package } from 'lucide-react-native';
import { API_ORIGIN } from '../../../core/api';
import { colors } from '../../../core/theme';
import { INVENTORY_COPY } from '../data';
import { inventoryStyles } from '../styles';
import type { InventoryItem, ProductImageItem, StockStatus } from '../types';

type StockItemCardProps = {
  item: InventoryItem;
  onPress: (item: InventoryItem) => void;
  showCategory?: boolean;
};

const STATUS_STYLE_MAP: Record<
  StockStatus,
  { bg: string; border: string; text: string }
> = {
  IN_STOCK: {
    bg: colors.successBg,
    border: colors.successBorder,
    text: colors.success,
  },
  LOW_STOCK: {
    bg: colors.warningBg,
    border: colors.warningBorder,
    text: colors.warning,
  },
  OUT_OF_STOCK: {
    bg: colors.dangerBg,
    border: colors.dangerBorder,
    text: colors.danger,
  },
};

function resolveImageUri(images: ProductImageItem[]): string | null {
  if (!images || images.length === 0) return null;
  const primary =
    images.find((img) => typeof img !== 'string' && img.isPrimary) ?? images[0];
  const rawUrl = typeof primary === 'string' ? primary : primary?.url;
  if (!rawUrl) return null;
  return rawUrl.startsWith('http') ? rawUrl : `${API_ORIGIN}${rawUrl}`;
}

export const StockItemCard = memo(function StockItemCardComponent({
  item,
  onPress,
  showCategory = true,
}: StockItemCardProps) {
  const statusTheme =
    STATUS_STYLE_MAP[item.stockStatus] ?? STATUS_STYLE_MAP.IN_STOCK;
  const imageUri = resolveImageUri(item.images);
  const threshold = Math.max(item.lowStockThreshold || 5, 1);
  const fillPercent = Math.min(
    100,
    Math.round((item.currentStock / (threshold * 3)) * 100),
  );

  return (
    <TouchableOpacity
      style={inventoryStyles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.8}
    >
      <View style={inventoryStyles.cardBodyRow}>
        <View style={inventoryStyles.cardThumbWrap}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={inventoryStyles.cardThumbImg}
              resizeMode="cover"
            />
          ) : (
            <Package size={20} color={colors.primary} />
          )}
        </View>

        <View style={inventoryStyles.cardInfoCol}>
          <View style={inventoryStyles.cardTop}>
            <View style={inventoryStyles.cardTitleWrap}>
              <Text style={inventoryStyles.productName} numberOfLines={1}>
                {item.productName}
              </Text>
              <View style={inventoryStyles.metaRow}>
                <Text style={inventoryStyles.productCode}>
                  {item.productCode}
                </Text>
                {showCategory ? (
                  <View style={inventoryStyles.categoryTag}>
                    <Text style={inventoryStyles.categoryTagText}>
                      {item.category || 'General'}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View
              style={[
                inventoryStyles.statusBadge,
                {
                  backgroundColor: statusTheme.bg,
                  borderColor: statusTheme.border,
                },
              ]}
            >
              <Text
                style={[
                  inventoryStyles.statusText,
                  { color: statusTheme.text },
                ]}
              >
                {INVENTORY_COPY.statusLabels[item.stockStatus] ??
                  item.stockStatus}
              </Text>
            </View>
          </View>

          <View style={inventoryStyles.stockBarTrack}>
            <View
              style={[
                inventoryStyles.stockBarFill,
                {
                  width: `${fillPercent}%`,
                  backgroundColor: statusTheme.text,
                },
              ]}
            />
          </View>

          <View style={inventoryStyles.cardBottom}>
            <Text style={inventoryStyles.stockLabel}>
              Total:{' '}
              <Text style={inventoryStyles.stockCount}>
                {item.currentStock} {item.unit}
              </Text>
            </Text>
            <Text style={inventoryStyles.stockLabel}>
              Avail:{' '}
              <Text style={inventoryStyles.stockCount}>
                {item.availableQuantity} {item.unit}
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});
