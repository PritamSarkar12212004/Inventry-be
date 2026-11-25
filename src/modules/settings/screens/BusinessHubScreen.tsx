import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Building2,
  ChevronRight,
  FileText,
  QrCode,
} from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/types';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from '../../../core/theme';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function BusinessHubScreen() {
  const navigation = useNavigation<NavProp>();

  const items = [
    {
      key: 'info',
      title: 'Business Info',
      subtitle: 'Address, PAN, bank details & stamp',
      icon: Building2,
      onPress: () => navigation.navigate('BusinessSettings'),
    },
    {
      key: 'qr',
      title: 'Payment & QR',
      subtitle: 'GST & Non-GST UPI QR codes',
      icon: QrCode,
      onPress: () => navigation.navigate('PaymentQr'),
    },
    {
      key: 'sample-pdf',
      title: 'Sample PDF',
      subtitle: 'Preview GST & Non-GST invoices',
      icon: FileText,
      onPress: () => navigation.navigate('SamplePdf'),
    },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
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
