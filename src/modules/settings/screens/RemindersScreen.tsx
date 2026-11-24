import React, { useCallback } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BellRing, ChevronRight, Package } from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/types';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from '../../../core/theme';
import { useBusinessSettings } from '../hooks';
import { BusinessSettingsSkeleton } from '../skeletons';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function RemindersScreen() {
  const navigation = useNavigation<NavProp>();
  const { data: settings, isLoading, isRefetching, refetch } =
    useBusinessSettings();

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  if (isLoading && !settings) {
    return <BusinessSettingsSkeleton />;
  }

  const payCfg = settings?.paymentReminderSettings;
  const paymentEnabled = Boolean(payCfg?.enabled);
  const firstDays = Number(payCfg?.firstReminderDays ?? 7);
  const repeatDays = Number(payCfg?.repeatEveryDays ?? 3);

  const stockCfg = settings?.stockReminderSettings;
  const stockEnabled =
    stockCfg?.enabled !== undefined ? Boolean(stockCfg.enabled) : true;
  const lowLimit = Number(stockCfg?.lowStockThreshold ?? 10);
  const stockRepeatDays = Number(stockCfg?.repeatEveryDays ?? 1);

  const items = [
    {
      key: 'payment',
      title: 'Payment Reminders',
      subtitle: `First after ${firstDays}d · Repeat every ${repeatDays}d (8:00 AM)`,
      enabled: paymentEnabled,
      icon: BellRing,
      onPress: () => navigation.navigate('PaymentReminder'),
    },
    {
      key: 'stock',
      title: 'Stock Reminders',
      subtitle: `Limit: ${lowLimit} units · Repeat every ${stockRepeatDays}d`,
      enabled: stockEnabled,
      icon: Package,
      onPress: () => navigation.navigate('StockReminder'),
    },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.card}
              activeOpacity={0.78}
              onPress={item.onPress}
            >
              <View style={styles.iconBox}>
                <Icon size={20} color={colors.primary} />
              </View>
              <View style={styles.infoWrap}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoWrap: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
