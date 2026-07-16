import React from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { ResponsiveTabBar } from './ResponsiveTabBar';

export const BottomNavigation: React.FC<BottomTabBarProps> = (props) => {
  return <ResponsiveTabBar {...props} />;
};
