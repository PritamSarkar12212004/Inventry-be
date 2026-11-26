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
import { ChevronRight, Receipt, Users } from 'lucide-react-native';
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

export function ExpensesHubScreen() {
  const navigation = useNavigation<NavProp>();

  const items = [
    {
      key: 'general',
      title: 'General Expenses',
      subtitle: 'Rent, electricity, transport, packaging & other',
      icon: Receipt,
      onPress: () => navigation.navigate('GeneralExpenses'),
    },
    {
      key: 'manpower',
      title: 'Manpower Expenses',
      subtitle: 'Labour wages, daily staff & manpower costs',
      icon: Users,
      onPress: () => navigation.navigate('ManpowerExpenses'),
    },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>EXPENSE CATEGORIES</Text>
        <View style={styles.menuGroup}>
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <React.Fragment key={item.key}>
                {idx > 0 ? <View style={styles.divider} /> : null}
                <TouchableOpacity
                  style={styles.menuRow}
                  activeOpacity={0.75}
                  onPress={item.onPress}
                >
                  <View style={styles.iconBox}>
                    <Icon size={20} color={colors.primary} />
                  </View>
                  <View style={styles.menuInfo}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSub}>{item.subtitle}</Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>
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
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: spacing.xs + 2,
    marginLeft: 2,
  },
  menuGroup: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginLeft: spacing.md + 40 + spacing.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  menuSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
