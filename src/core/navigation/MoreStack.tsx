import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MoreStackParamList } from './types';
import { PlaceholderScreen } from './PlaceholderScreen';
import { colors, fontWeight } from '../theme';

const Stack = createNativeStackNavigator<MoreStackParamList>();

const MoreMenuScreen = () => (
  <PlaceholderScreen
    title="More Modules"
    subtitle="Manufacturing, Returns & Damage, Financials, Reports, Settings"
  />
);
const ManufacturingScreen = () => <PlaceholderScreen title="Manufacturing" />;
const ReturnsDamageScreen = () => <PlaceholderScreen title="Returns & Damage" />;
const FinancialScreen = () => <PlaceholderScreen title="Financials & Expenses" />;
const ReportsScreen = () => <PlaceholderScreen title="Reports" />;
const SettingsScreen = () => <PlaceholderScreen title="Business Settings" />;
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
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Sessions" component={SessionsScreen} />
    </Stack.Navigator>
  );
}
