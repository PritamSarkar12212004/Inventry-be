import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { PlaceholderScreen } from './PlaceholderScreen';
import { colors, fontWeight } from '../theme';
import { useAuthStore } from '../store/authStore';

const RootStack = createNativeStackNavigator<RootStackParamList>();

const ProductDetailScreen = () => <PlaceholderScreen title="Product Detail" />;
const ProductFormScreen = () => (
  <PlaceholderScreen title="Add / Edit Product" />
);
const StockEntryFormScreen = () => <PlaceholderScreen title="Stock Entry" />;
const InvoiceDetailScreen = () => (
  <PlaceholderScreen title="Invoice Detail & PDF" />
);
const GrnFormScreen = () => <PlaceholderScreen title="Create / Confirm GRN" />;
const DamageFormScreen = () => <PlaceholderScreen title="Report Damage" />;

export default function RootNavigator() {
  const { isAuthenticated } = useAuthStore();

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
              options={{ title: 'Product Form', presentation: 'modal' }}
            />
            <RootStack.Screen
              name="StockEntryForm"
              component={StockEntryFormScreen}
              options={{ title: 'Stock Entry', presentation: 'modal' }}
            />
            <RootStack.Screen
              name="InvoiceDetail"
              component={InvoiceDetailScreen}
              options={{ title: 'Invoice' }}
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
