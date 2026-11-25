import React from 'react';
import {
  createDrawerNavigator,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { MainTabs } from './MainTabs';
import { ProfileTabScreen } from '../../modules/auth';
import { colors } from '../theme';

export type MainDrawerParamList = {
  MainTabs: undefined;
};

const Drawer = createDrawerNavigator<MainDrawerParamList>();

const renderDrawerContent = (props: DrawerContentComponentProps) => (
  <ProfileTabScreen onCloseDrawer={() => props.navigation.closeDrawer()} />
);

export function MainDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={renderDrawerContent}
      screenOptions={{
        headerShown: false,
        drawerPosition: 'right',
        drawerType: 'front',
        swipeEnabled: true,
        swipeEdgeWidth: 48,
        overlayColor: 'rgba(15, 23, 42, 0.35)',
        drawerStyle: {
          width: '82%',
          maxWidth: 340,
          backgroundColor: colors.background,
        },
      }}
    >
      <Drawer.Screen name="MainTabs" component={MainTabs} />
    </Drawer.Navigator>
  );
}
