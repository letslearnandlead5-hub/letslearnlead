import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { Alert } from 'react-native';

import App from './App';

// Global error boundary to trap and display unhandled JS exceptions before startup crash
if ((global as any).ErrorUtils) {
  const originalHandler = (global as any).ErrorUtils.getGlobalHandler();
  (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
    Alert.alert(
      'Application Error',
      `${error.message || error}\n\nStack: ${error.stack || 'N/A'}`,
      [{ text: 'Dismiss' }]
    );
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
