import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  Package,
  ShoppingCart,
  User,
  Wallet,
} from 'lucide-react-native';
import type {
  MainTabsParamList,
  SalesTopTabsParamList,
  StockTopTabsParamList,
} from './types';
import { MainHeader, type ExcelExportTarget } from '../components/MainHeader';
import { colors, fontSize, fontWeight, radius, shadows } from '../theme';
import { ProfileTabScreen } from '../../modules/auth';
import { DashboardScreen } from '../../modules/dashboard';
import { AllStockScreen, LowStockScreen } from '../../modules/inventory';
import { CustomersScreen, SalesOrdersScreen } from '../../modules/orders';
import {
  FinancialScreen,
  SuppliersPurchasesScreen,
} from '../../modules/financial';

const BottomTab = createBottomTabNavigator<MainTabsParamList>();
const StockTopTab = createMaterialTopTabNavigator<StockTopTabsParamList>();
const SalesTopTab = createMaterialTopTabNavigator<SalesTopTabsParamList>();

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
  lazy: true,
  lazyPreloadDistance: 0,
};

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
        options={{ title: 'Stock Alerts' }}
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
      <SalesTopTab.Screen
        name="Suppliers"
        options={{ title: 'Suppliers' }}
        component={SuppliersPurchasesScreen}
      />
    </SalesTopTab.Navigator>
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
    <Wallet color={color} size={size - 2} strokeWidth={focused ? 2.3 : 1.8} />
  </TabIconBadge>
);
const renderProfileIcon = ({ focused, color, size }: TabIconProps) => (
  <TabIconBadge focused={focused}>
    <User
      color={color}
      size={size - 2}
      strokeWidth={focused ? 2.3 : 1.8}
    />
  </TabIconBadge>
);

export function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  const [activeTab, setActiveTab] = useState<string>('HomeTab');

  const exportTarget: ExcelExportTarget | null =
    activeTab === 'StockTab'
      ? 'STOCK'
      : activeTab === 'SalesTab'
        ? 'SALES'
        : activeTab === 'ReceiveTab'
          ? 'FINANCE'
          : null;

  return (
    <View style={styles.wrapper}>
      <MainHeader exportTarget={exportTarget} />
      <BottomTab.Navigator
        screenListeners={{
          state: (e) => {
            const tabState = e.data.state;
            const currentRoute = tabState?.routes[tabState.index ?? 0]?.name;
            if (currentRoute) {
              setActiveTab(currentRoute);
            }
          },
        }}
        screenOptions={{
          headerShown: false,
          lazy: true,
          freezeOnBlur: true,
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
        component={FinancialScreen}
        options={{
          title: 'Finance',
          tabBarIcon: renderReceiveIcon,
        }}
      />
      <BottomTab.Screen
        name="MoreTab"
        component={ProfileTabScreen}
        options={{
          title: 'Profile',
          tabBarIcon: renderProfileIcon,
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
