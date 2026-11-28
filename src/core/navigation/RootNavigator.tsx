import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { AuthStack } from './AuthStack';
import { MainDrawer } from './MainDrawer';
import { PlaceholderScreen } from './PlaceholderScreen';
import { IosLoader } from '../components/IosLoader';
import { colors, fontWeight } from '../theme';
import { authStore, useAuthStore } from '../store/authStore';
import { ProfileScreen } from '../../modules/auth';
import {
  BusinessHubScreen,
  BusinessSettingsScreen,
  PaymentQrScreen,
  PaymentReminderScreen,
  RemindersScreen,
  SamplePdfScreen,
  StockReminderScreen,
} from '../../modules/settings';
import {
  ProductDetailScreen,
  ProductFormScreen,
  StockEntryFormScreen,
  StockOverviewDetailScreen,
} from '../../modules/inventory';
import {
  CustomerDetailScreen,
  SalesOrderDetailScreen,
  SalesOrderFormScreen,
  SalesOverviewDetailScreen,
} from '../../modules/orders';
import {
  AnalyticsScreen,
  CustomerPendingDetailScreen,
  ExpensesOverviewDetailScreen,
  ExpensesScreen,
  FinancialOverviewDetailScreen,
  FinancialScreen,
  GeneralExpensesOverviewScreen,
  GeneralExpensesScreen,
  SupplierOverviewDetailScreen,
  SupplierPurchaseDetailScreen,
} from '../../modules/financial';

const ManpowerExpensesScreen = () => <ExpensesScreen mode="MANPOWER" />;
const CategoryExpensesScreen = ({
  route,
}: {
  route: { params: { categoryCode: string; categoryName: string } };
}) => (
  <ExpensesScreen
    mode="GENERAL"
    categoryCode={route.params.categoryCode}
    categoryName={route.params.categoryName}
  />
);
const ExpenseTitleDetailScreen = ({
  route,
}: {
  route: {
    params: {
      title: string;
      mode: 'GENERAL' | 'MANPOWER';
      categoryCode?: string;
      categoryName?: string;
      lockedWorkType?: 'CONTRACT' | 'SALARY' | 'DAILY_WAGE';
    };
  };
}) => (
  <ExpensesScreen
    mode={route.params.mode}
    categoryCode={route.params.categoryCode}
    categoryName={route.params.categoryName}
    titleFilter={route.params.title}
    lockedWorkType={route.params.lockedWorkType}
  />
);

const RootStack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.borderSubtle,
    primary: colors.primary,
  },
};

const InvoiceDetailScreen = () => (
  <PlaceholderScreen title="Invoice Detail & PDF" />
);
const GrnFormScreen = () => <PlaceholderScreen title="Create / Confirm GRN" />;
const DamageFormScreen = () => <PlaceholderScreen title="Report Damage" />;

export default function RootNavigator() {
  const { isAuthenticated, isProfileCompleted, isHydrating } = useAuthStore();

  useEffect(() => {
    authStore.hydrate();
  }, []);

  if (isHydrating) {
    return (
      <View style={styles.splash}>
        <IosLoader size={30} color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.rootBg}>
      <NavigationContainer theme={navTheme}>
        <RootStack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { fontWeight: fontWeight.bold },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'fade',
            freezeOnBlur: true,
          }}
        >
        {!isAuthenticated ? (
          <RootStack.Screen
            name="Auth"
            component={AuthStack}
            options={{ headerShown: false }}
          />
        ) : !isProfileCompleted ? (
          <RootStack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <RootStack.Screen
              name="Main"
              component={MainDrawer}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="StockOverviewDetail"
              component={StockOverviewDetailScreen}
              options={{ title: 'Inventory Overview' }}
            />
            <RootStack.Screen
              name="SalesOverviewDetail"
              component={SalesOverviewDetailScreen}
              options={{ title: 'Sales Overview' }}
            />
            <RootStack.Screen
              name="FinancialOverviewDetail"
              component={FinancialOverviewDetailScreen}
              options={{ title: 'Financial Overview' }}
            />
            <RootStack.Screen
              name="Analytics"
              component={AnalyticsScreen}
              options={{ title: 'Analytics' }}
            />
            <RootStack.Screen
              name="SupplierOverviewDetail"
              component={SupplierOverviewDetailScreen}
              options={{ title: 'Suppliers Overview' }}
            />
            <RootStack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={{ title: 'Product Details' }}
            />
            <RootStack.Screen
              name="ProductForm"
              component={ProductFormScreen}
              options={{ title: 'Edit Product', presentation: 'modal' }}
            />
            <RootStack.Screen
              name="CustomerDetail"
              component={CustomerDetailScreen}
              options={{ title: 'Customer Details' }}
            />
            <RootStack.Screen
              name="SalesOrderDetail"
              component={SalesOrderDetailScreen}
              options={{ title: 'Order & Invoice' }}
            />
            <RootStack.Screen
              name="SalesOrderForm"
              component={SalesOrderFormScreen}
              options={{ title: 'New Sale', presentation: 'modal' }}
            />
            <RootStack.Screen
              name="StockEntryForm"
              component={StockEntryFormScreen}
              options={{ title: 'Add Stock', presentation: 'modal' }}
            />
            <RootStack.Screen
              name="InvoiceDetail"
              component={InvoiceDetailScreen}
              options={{ title: 'Invoice' }}
            />
            <RootStack.Screen
              name="CustomerPendingDetail"
              component={CustomerPendingDetailScreen}
              options={{ title: 'Pending' }}
            />
            <RootStack.Screen
              name="SupplierPurchaseDetail"
              component={SupplierPurchaseDetailScreen}
              options={{ title: 'Purchase & Expense Details' }}
            />
            <RootStack.Screen
              name="EditProfile"
              component={ProfileScreen}
              options={{ title: 'Edit Profile' }}
            />
            <RootStack.Screen
              name="Finance"
              component={FinancialScreen}
              options={{ title: 'Finance' }}
            />
            <RootStack.Screen
              name="GeneralExpenses"
              component={GeneralExpensesScreen}
              options={{ title: 'Expenses' }}
            />
            <RootStack.Screen
              name="GeneralExpensesOverview"
              component={GeneralExpensesOverviewScreen}
              options={{ title: 'Overview' }}
            />
            <RootStack.Screen
              name="CategoryExpenses"
              component={CategoryExpensesScreen}
              options={({ route }) => ({
                title: route.params.categoryName || 'Expenses',
              })}
            />
            <RootStack.Screen
              name="ExpenseTitleDetail"
              component={ExpenseTitleDetailScreen}
              options={({ route }) => ({
                title: route.params.title || 'History',
              })}
            />
            <RootStack.Screen
              name="ExpensesOverviewDetail"
              component={ExpensesOverviewDetailScreen}
              options={{ title: 'Overview' }}
            />
            <RootStack.Screen
              name="ManpowerExpenses"
              component={ManpowerExpensesScreen}
              options={{ title: 'Manpower' }}
            />
            <RootStack.Screen
              name="BusinessHub"
              component={BusinessHubScreen}
              options={{ title: 'Business & Billing' }}
            />
            <RootStack.Screen
              name="BusinessSettings"
              component={BusinessSettingsScreen}
              options={{ title: 'Business Info' }}
            />
            <RootStack.Screen
              name="PaymentQr"
              component={PaymentQrScreen}
              options={{ title: 'Payment & QR Code' }}
            />
            <RootStack.Screen
              name="Reminders"
              component={RemindersScreen}
              options={{ title: 'Reminders' }}
            />
            <RootStack.Screen
              name="PaymentReminder"
              component={PaymentReminderScreen}
              options={{ title: 'Payment Reminders' }}
            />
            <RootStack.Screen
              name="SamplePdf"
              component={SamplePdfScreen}
              options={{ title: 'Sample PDF' }}
            />
            <RootStack.Screen
              name="StockReminder"
              component={StockReminderScreen}
              options={{ title: 'Stock Reminders' }}
            />
            <RootStack.Screen
              name="GrnForm"
              component={GrnFormScreen}
              options={{ title: 'Receive Maal (GRN)', presentation: 'modal' }}
            />
            <RootStack.Screen
              name="DamageForm"
              component={DamageFormScreen}
              options={{ title: 'Report Damage', presentation: 'modal' }}
            />
          </>
        )}
        </RootStack.Navigator>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  rootBg: {
    flex: 1,
    backgroundColor: colors.background,
  },
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
});
