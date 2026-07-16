import React from 'react';
import { View, StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  hasTabBar?: boolean;
  style?: ViewStyle;
  backgroundColor?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  hasTabBar = false,
  style,
  backgroundColor = Colors.background,
  edges = ['top', 'left', 'right'], // Default avoids double padding at the bottom
}) => {
  const insets = useSafeAreaInsets();

  const containerPadding = () => {
    const padding: ViewStyle = {};
    if (edges.includes('top')) {
      padding.paddingTop = insets.top;
    }
    if (edges.includes('left')) {
      padding.paddingLeft = insets.left;
    }
    if (edges.includes('right')) {
      padding.paddingRight = insets.right;
    }
    if (edges.includes('bottom')) {
      padding.paddingBottom = insets.bottom;
    }

    if (hasTabBar) {
      // Dynamic padding: tab bar height is 64 base + bottom inset
      // Adding a padding at the bottom ensures content scroll limits end above the tab bar
      const bottomTabPadding = 64 + insets.bottom;
      padding.paddingBottom = (padding.paddingBottom || 0) as number + bottomTabPadding;
    }

    return padding;
  };

  return (
    <View style={[styles.container, { backgroundColor }, containerPadding(), style]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
