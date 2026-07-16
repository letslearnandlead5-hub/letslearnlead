import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets, Edge } from 'react-native-safe-area-context';
import { Colors } from '../../theme';

interface SafeAreaLayoutProps {
  children: React.ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
  backgroundColor?: string;
}

export const SafeAreaLayout: React.FC<SafeAreaLayoutProps> = ({
  children,
  edges = ['top', 'bottom', 'left', 'right'],
  style,
  backgroundColor = Colors.background,
}) => {
  const insets = useSafeAreaInsets();

  const getEdgePadding = () => {
    const padding: ViewStyle = {};
    if (edges.includes('top')) {
      padding.paddingTop = insets.top;
    }
    if (edges.includes('bottom')) {
      padding.paddingBottom = insets.bottom;
    }
    if (edges.includes('left')) {
      padding.paddingLeft = insets.left;
    }
    if (edges.includes('right')) {
      padding.paddingRight = insets.right;
    }
    return padding;
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor },
        getEdgePadding(),
        style,
      ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
