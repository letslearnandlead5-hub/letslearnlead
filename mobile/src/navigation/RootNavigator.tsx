import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { SplashScreen } from '../screens/SplashScreen';
import { Colors } from '../theme';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const Root = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  return (
    <Root.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'fade',
      }}>
      {!isAuthenticated ? (
        <>
          <Root.Screen name="Splash" component={SplashScreen} />
          <Root.Screen name="Auth" component={AuthNavigator} />
        </>
      ) : (
        <Root.Screen name="App" component={AppNavigator} />
      )}
    </Root.Navigator>
  );
};
