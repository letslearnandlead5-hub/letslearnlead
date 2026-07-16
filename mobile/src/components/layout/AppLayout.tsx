import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../theme';

interface AppLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, style }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }, style]}>
      <StatusBar style="dark" backgroundColor={Colors.background} translucent />
      <View
        style={[
          styles.container,
          {
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
