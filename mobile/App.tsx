import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';

import { AppProviders } from './src/providers/AppProviders';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthRequiredBottomSheet } from './src/components/layout/AuthRequiredBottomSheet';
import { navigationRef } from './src/navigation/navigationRef';
import { Colors } from './src/theme';

export default function App() {
  return (
    <AppProviders>
      <NavigationContainer
        ref={navigationRef}
        theme={{
          dark: false,
          colors: {
            primary: Colors.primary,
            background: Colors.background,
            card: Colors.surface,
            text: Colors.text,
            border: Colors.border,
            notification: Colors.secondary,
          },
        }}>
        <StatusBar style="dark" backgroundColor={Colors.background} />
        <RootNavigator />
        <AuthRequiredBottomSheet />
      </NavigationContainer>
      <Toast />
    </AppProviders>
  );
}
