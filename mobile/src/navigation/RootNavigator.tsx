import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { SplashScreen } from '../screens/SplashScreen';
import { Colors } from '../theme';

const Root = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <Root.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'fade',
      }}>
      <Root.Screen name="Splash" component={SplashScreen} />
      <Root.Screen name="App" component={AppNavigator} />
      <Root.Screen name="Auth" component={AuthNavigator} />
    </Root.Navigator>
  );
};
