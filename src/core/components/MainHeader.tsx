import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Building2, Share2 } from 'lucide-react-native';
import { API_ORIGIN } from '../api';
import { popup } from '../store/popupStore';
import { useStockSelectionStore } from '../store/stockSelectionStore';
import { colors, fontSize, fontWeight, radius, spacing } from '../theme';
import { useBusinessSettings, useMe } from '../../modules/auth/hooks';

type MainHeaderProps = {
  onPressNotification?: () => void;
};

export function MainHeader({ onPressNotification }: MainHeaderProps) {
  const { data: business } = useBusinessSettings();
  const { data: user } = useMe();
  const { selectedCount } = useStockSelectionStore();

  const handlePressShare = () => {
    popup.info(
      'Share Stock (Under Development)',
      `Sharing ${selectedCount} selected item${selectedCount === 1 ? '' : 's'} with stock name, code & quantity is currently under development.`,
    );
  };

  const companyName =
    business?.businessName || user?.name || 'WishBox Inventory';
  const logoUrl = business?.logoUrl
    ? business.logoUrl.startsWith('http')
      ? business.logoUrl
      : `${API_ORIGIN}${business.logoUrl}`
    : null;

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.left}>
          <View style={styles.logoWrap}>
            {logoUrl ? (
              <Image
                source={{ uri: logoUrl }}
                style={styles.logoImg}
                resizeMode="cover"
              />
            ) : (
              <Building2 size={20} color={colors.primary} />
            )}
          </View>

          <Text style={styles.companyName} numberOfLines={1}>
            {companyName}
          </Text>
        </View>

        {selectedCount > 0 ? (
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handlePressShare}
            activeOpacity={0.75}
          >
            <Share2 size={17} color={colors.primary} />
            <Text style={styles.shareCountText}>{selectedCount}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onPressNotification}
            activeOpacity={0.75}
          >
            <Bell size={19} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    marginRight: spacing.md,
  },
  logoWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  companyName: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 38,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  shareCountText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
});
