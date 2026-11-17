import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { MainHeader } from '../components/MainHeader';
import { PlaceholderScreen } from './PlaceholderScreen';
import { MoreStack } from './MoreStack';
import { colors, fontSize, fontWeight, radius, shadows } from '../theme';
import { AllStockScreen, LowStockScreen } from '../../modules/inventory';
import { CustomersScreen, SalesOrdersScreen } from '../../modules/orders';

const BottomTab = createBottomTabNavigator<MainTabsParamList>();
const StockTopTab = createMaterialTopTabNavigator<StockTopTabsParamList>();
const SalesTopTab = createMaterialTopTabNavigator<SalesTopTabsParamList>();
const PurchaseTopTab =
  createMaterialTopTabNavigator<PurchaseTopTabsParamList>();

const topTabScreenOptions = {
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textSecondary,
  tabBarIndicatorStyle: {
    backgroundColor: colors.primary,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tabBarStyle: {
    backgroundColor: colors.surface,
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
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
      title="Inventory Dashboard"
      subtitle="KPIs, Quick Actions, Low Stock Alerts"
    />
  );
}

function StockTopTabs() {
  return (
    <StockTopTab.Navigator
      screenOptions={{
        ...topTabScreenOptions,
        tabBarScrollEnabled: false,
      }}
    >
      <StockTopTab.Screen
        name="AllStock"
        options={{ title: 'All Stock' }}
        component={AllStockScreen}
      />
      <StockTopTab.Screen
        name="LowStock"
        options={{ title: 'Low Stock' }}
        component={LowStockScreen}
      />
    </StockTopTab.Navigator>
  );
}

function SalesTopTabs() {
  return (
    <SalesTopTab.Navigator
      screenOptions={{
        ...topTabScreenOptions,
        tabBarScrollEnabled: false,
      }}
    >
      <SalesTopTab.Screen
        name="SalesOrders"
        options={{ title: 'Orders' }}
        component={SalesOrdersScreen}
      />
      <SalesTopTab.Screen
        name="Customers"
        options={{ title: 'Customers' }}
        component={CustomersScreen}
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
        children={() => (
          <PlaceholderScreen title="Goods Received Notes (GRN)" />
        )}
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

type TabIconProps = { focused: boolean; color: string; size: number };

function TabIconBadge({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.iconPill, focused && styles.iconPillActive]}>
      {children}
    </View>
  );
}

const renderHomeIcon = ({ focused, color, size }: TabIconProps) => (
  <TabIconBadge focused={focused}>
    <Home color={color} size={size - 2} strokeWidth={focused ? 2.3 : 1.8} />
  </TabIconBadge>
);
const renderStockIcon = ({ focused, color, size }: TabIconProps) => (
  <TabIconBadge focused={focused}>
    <Package color={color} size={size - 2} strokeWidth={focused ? 2.3 : 1.8} />
  </TabIconBadge>
);
const renderSalesIcon = ({ focused, color, size }: TabIconProps) => (
  <TabIconBadge focused={focused}>
    <ShoppingCart
      color={color}
      size={size - 2}
      strokeWidth={focused ? 2.3 : 1.8}
    />
  </TabIconBadge>
);
const renderReceiveIcon = ({ focused, color, size }: TabIconProps) => (
  <TabIconBadge focused={focused}>
    <Truck color={color} size={size - 2} strokeWidth={focused ? 2.3 : 1.8} />
  </TabIconBadge>
);
const renderMoreIcon = ({ focused, color, size }: TabIconProps) => (
  <TabIconBadge focused={focused}>
    <LayoutGrid
      color={color}
      size={size - 2}
      strokeWidth={focused ? 2.3 : 1.8}
    />
  </TabIconBadge>
);

export function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <View style={styles.wrapper}>
      <MainHeader />
      <BottomTab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
          height: 58 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 8,
          ...shadows.card,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: fontWeight.semibold,
          marginTop: 2,
        },
      }}
    >
      <BottomTab.Screen
        name="HomeTab"
        component={DashboardScreen}
        options={{
          title: 'Home',
          tabBarIcon: renderHomeIcon,
        }}
      />
      <BottomTab.Screen
        name="StockTab"
        component={StockTopTabs}
        options={{
          title: 'Stock',
          tabBarIcon: renderStockIcon,
        }}
      />
      <BottomTab.Screen
        name="SalesTab"
        component={SalesTopTabs}
        options={{
          title: 'Sales',
          tabBarIcon: renderSalesIcon,
        }}
      />
      <BottomTab.Screen
        name="ReceiveTab"
        component={PurchaseTopTabs}
        options={{
          title: 'Receive',
          tabBarIcon: renderReceiveIcon,
        }}
      />
      <BottomTab.Screen
        name="MoreTab"
        component={MoreStack}
        options={{
          title: 'More',
          tabBarIcon: renderMoreIcon,
        }}
      />
      </BottomTab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  iconPill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  iconPillActive: {},
});
