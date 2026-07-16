import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CourseProvider } from '../context/CourseContext';
import { useAuthStore } from '../store/useAuthStore';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we initialize auth
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeAuth();
      } catch (e) {
        console.error('Auth initialization error:', e);
      } finally {
        // Hide splash screen after initialization
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          // ignore
        }
      }
    };
    init();
  }, [initializeAuth]);

  return <>{children}</>;
};

export const AppProviders: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <CourseProvider>
            <AuthInitializer>
              {children}
            </AuthInitializer>
          </CourseProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
