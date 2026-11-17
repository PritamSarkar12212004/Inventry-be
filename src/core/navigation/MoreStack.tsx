import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Building2, ChevronRight } from 'lucide-react-native';
import type { MoreStackParamList } from './types';
import { PlaceholderScreen } from './PlaceholderScreen';
import { colors, fontSize, fontWeight, radius, spacing } from '../theme';
import { BusinessSettingsScreen } from '../../modules/settings';

const Stack = createNativeStackNavigator<MoreStackParamList>();

type MoreMenuProps = NativeStackScreenProps<MoreStackParamList, 'MoreMenu'>;

function MoreMenuScreen({ navigation }: MoreMenuProps) {
  return (
    <View style={styles.menuScreen}>
      <TouchableOpacity
        style={styles.menuCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Settings')}
      >
        <View style={styles.iconBox}>
          <Building2 size={20} color={colors.primary} />
        </View>
        <View style={styles.menuInfo}>
          <Text style={styles.menuTitle}>Business & Invoice Settings</Text>
          <Text style={styles.menuSubtitle}>
            Company name, GSTIN, PAN, address & bank details for PDFs
          </Text>
        </View>
        <ChevronRight size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}
const ManufacturingScreen = () => <PlaceholderScreen title="Manufacturing" />;
const ReturnsDamageScreen = () => <PlaceholderScreen title="Returns & Damage" />;
const FinancialScreen = () => <PlaceholderScreen title="Financials & Expenses" />;
const ReportsScreen = () => <PlaceholderScreen title="Reports" />;
const SessionsScreen = () => <PlaceholderScreen title="Active Sessions" />;

export function MoreStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: fontWeight.bold },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="MoreMenu"
        component={MoreMenuScreen}
        options={{ title: 'More' }}
      />
      <Stack.Screen name="Manufacturing" component={ManufacturingScreen} />
      <Stack.Screen
        name="ReturnsDamage"
        component={ReturnsDamageScreen}
        options={{ title: 'Returns & Damage' }}
      />
      <Stack.Screen
        name="Financial"
        component={FinancialScreen}
        options={{ title: 'Financials & Expenses' }}
      />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen
        name="Settings"
        component={BusinessSettingsScreen}
        options={{ title: 'Business & Invoice Settings' }}
      />
      <Stack.Screen name="Sessions" component={SessionsScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  menuScreen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
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
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
