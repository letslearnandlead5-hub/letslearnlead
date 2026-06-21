import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';

import { AuthProvider } from './src/context/AuthContext';
import { CourseProvider } from './src/context/CourseContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Colors } from './src/theme';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <CourseProvider>
            <NavigationContainer
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
            </NavigationContainer>
            <Toast />
          </CourseProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
