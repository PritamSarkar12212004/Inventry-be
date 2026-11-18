import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { PlaceholderScreen } from './PlaceholderScreen';
import { IosLoader } from '../components/IosLoader';
import { colors, fontWeight } from '../theme';
import { authStore, useAuthStore } from '../store/authStore';
import { ProfileScreen } from '../../modules/auth';
import {
  ProductDetailScreen,
  ProductFormScreen,
  StockEntryFormScreen,
} from '../../modules/inventory';
import {
  CustomerDetailScreen,
  SalesOrderDetailScreen,
  SalesOrderFormScreen,
} from '../../modules/orders';
import {
  CustomerPendingDetailScreen,
  SupplierPurchaseDetailScreen,
} from '../../modules/financial';

const RootStack = createNativeStackNavigator<RootStackParamList>();

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
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { fontWeight: fontWeight.bold },
          headerShadowVisible: false,
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
              component={MainTabs}
              options={{ headerShown: false }}
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
              options={{ title: 'Pending Invoices' }}
            />
            <RootStack.Screen
              name="SupplierPurchaseDetail"
              component={SupplierPurchaseDetailScreen}
              options={{ title: 'Purchase & Expense Details' }}
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
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
});
