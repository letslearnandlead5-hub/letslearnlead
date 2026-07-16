import React from 'react';
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ViewStyle,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from './ScreenContainer';
import { Colors } from '../../theme';

interface ScrollableScreenProps {
  children: React.ReactNode;
  hasTabBar?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  backgroundColor?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
}

export const ScrollableScreen: React.FC<ScrollableScreenProps> = ({
  children,
  hasTabBar = false,
  style,
  contentContainerStyle,
  backgroundColor = Colors.background,
  refreshing = false,
  onRefresh,
  keyboardShouldPersistTaps = 'handled',
}) => {
  const insets = useSafeAreaInsets();

  // Bottom padding formula: bottom safe inset + (if tab bar: tab bar height 64) + extra visual breathing room (16)
  const bottomPadding = insets.bottom + (hasTabBar ? 64 : 0) + 16;

  return (
    <ScreenContainer
      edges={['top', 'left', 'right']} // Exclude bottom edge because it's handled by padding inside ScrollView content
      backgroundColor={backgroundColor}
      style={style}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomPadding },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            ) : undefined
          }>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
