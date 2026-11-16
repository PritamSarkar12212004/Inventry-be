import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import {
  Home,
  Package,
  ShoppingCart,
  Truck,
  LayoutGrid,
} from 'lucide-react-native';
import type {
  MainTabsParamList,
  PurchaseTopTabsParamList,
  SalesTopTabsParamList,
  StockTopTabsParamList,
} from './types';
import { PlaceholderScreen } from './PlaceholderScreen';
import { MoreStack } from './MoreStack';
import { colors, fontSize, fontWeight } from '../theme';

const BottomTab = createBottomTabNavigator<MainTabsParamList>();
const StockTopTab = createMaterialTopTabNavigator<StockTopTabsParamList>();
const SalesTopTab = createMaterialTopTabNavigator<SalesTopTabsParamList>();
const PurchaseTopTab = createMaterialTopTabNavigator<PurchaseTopTabsParamList>();

const topTabScreenOptions = {
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textSecondary,
  tabBarIndicatorStyle: { backgroundColor: colors.primary, height: 2.5 },
  tabBarStyle: { backgroundColor: colors.surface, elevation: 0 },
  tabBarLabelStyle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'none' as const,
  },
  tabBarScrollEnabled: true,
};

function DashboardScreen() {
  return (
    <PlaceholderScreen
      title="Warehouse Dashboard"
      subtitle="KPIs, Quick Actions, Low Stock Alerts"
    />
  );
}

function StockTopTabs() {
  return (
    <StockTopTab.Navigator screenOptions={topTabScreenOptions}>
      <StockTopTab.Screen
        name="AllStock"
        options={{ title: 'All Stock' }}
        children={() => <PlaceholderScreen title="All Stock & Products" />}
      />
      <StockTopTab.Screen
        name="LowStock"
        options={{ title: 'Low Stock' }}
        children={() => <PlaceholderScreen title="Low Stock Alerts" />}
      />
      <StockTopTab.Screen
        name="Batches"
        options={{ title: 'Batches' }}
        children={() => <PlaceholderScreen title="Inventory Batches" />}
      />
      <StockTopTab.Screen
        name="StockAudits"
        options={{ title: 'Audits' }}
        children={() => <PlaceholderScreen title="Stock Audits" />}
      />
    </StockTopTab.Navigator>
  );
}

function SalesTopTabs() {
  return (
    <SalesTopTab.Navigator screenOptions={topTabScreenOptions}>
      <SalesTopTab.Screen
        name="SalesOrders"
        options={{ title: 'Orders' }}
        children={() => <PlaceholderScreen title="Sales Orders" />}
      />
      <SalesTopTab.Screen
        name="Dispatches"
        options={{ title: 'Dispatches' }}
        children={() => <PlaceholderScreen title="Dispatches" />}
      />
      <SalesTopTab.Screen
        name="Invoices"
        options={{ title: 'Invoices' }}
        children={() => <PlaceholderScreen title="GST / Non-GST Invoices" />}
      />
      <SalesTopTab.Screen
        name="Customers"
        options={{ title: 'Customers' }}
        children={() => <PlaceholderScreen title="Customers" />}
      />
    </SalesTopTab.Navigator>
  );
}

function PurchaseTopTabs() {
  return (
    <PurchaseTopTab.Navigator screenOptions={topTabScreenOptions}>
      <PurchaseTopTab.Screen
        name="PurchaseOrders"
        options={{ title: 'POs' }}
        children={() => <PlaceholderScreen title="Purchase Orders" />}
      />
      <PurchaseTopTab.Screen
        name="GrnList"
        options={{ title: 'GRN' }}
        children={() => <PlaceholderScreen title="Goods Received Notes (GRN)" />}
      />
      <PurchaseTopTab.Screen
        name="PurchaseReturns"
        options={{ title: 'Returns' }}
        children={() => <PlaceholderScreen title="Purchase Returns" />}
      />
      <PurchaseTopTab.Screen
        name="Suppliers"
        options={{ title: 'Suppliers' }}
        children={() => <PlaceholderScreen title="Suppliers" />}
      />
    </PurchaseTopTab.Navigator>
  );
}

export function MainTabs() {
  return (
    <BottomTab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: fontWeight.bold },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: fontWeight.semibold,
        },
      }}
    >
      <BottomTab.Screen
        name="HomeTab"
        component={DashboardScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <BottomTab.Screen
        name="StockTab"
        component={StockTopTabs}
        options={{
          title: 'Stock',
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />
      <BottomTab.Screen
        name="SalesTab"
        component={SalesTopTabs}
        options={{
          title: 'Sales',
          tabBarIcon: ({ color, size }) => (
            <ShoppingCart color={color} size={size} />
          ),
        }}
      />
      <BottomTab.Screen
        name="ReceiveTab"
        component={PurchaseTopTabs}
        options={{
          title: 'Receive',
          tabBarIcon: ({ color, size }) => <Truck color={color} size={size} />,
        }}
      />
      <BottomTab.Screen
        name="MoreTab"
        component={MoreStack}
        options={{
          title: 'More',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <LayoutGrid color={color} size={size} />
          ),
        }}
      />
    </BottomTab.Navigator>
  );
}
