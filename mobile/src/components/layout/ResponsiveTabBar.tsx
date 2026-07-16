import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard,
  Animated,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows } from '../../theme';

const ROOT_ROUTES = ['Home', 'MyCoursesList', 'QuizzesList', 'DoubtsList', 'ProfileHome'];

export const ResponsiveTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const activeRoute = state.routes[state.index];
  const focusedRouteName = getFocusedRouteNameFromRoute(activeRoute);
  const isSubScreen = focusedRouteName && !ROOT_ROUTES.includes(focusedRouteName);

  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [animatedOpacity] = useState(new Animated.Value(1));

  useEffect(() => {
    const showListener = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
      () => {
        Animated.timing(animatedOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => setIsKeyboardVisible(true));
      }
    );

    const hideListener = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
      () => {
        setIsKeyboardVisible(false);
        Animated.timing(animatedOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, [animatedOpacity]);

  if (isKeyboardVisible || isSubScreen) {
    return null;
  }

  // Floating responsive height = 64px base + safe area bottom inset
  const tabBarHeight = 64 + insets.bottom;

  return (
    <Animated.View
      style={[
        styles.tabBarContainer,
        {
          height: tabBarHeight,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          opacity: animatedOpacity,
        },
      ]}>
      <View style={styles.tabBarInner}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              (navigation.navigate as any)({ name: route.name, merge: true });
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Render icon using options.tabBarIcon
          const renderIcon = () => {
            if (options.tabBarIcon) {
              return options.tabBarIcon({
                focused: isFocused,
                color: isFocused ? Colors.tabActive : Colors.tabInactive,
                size: 24,
              });
            }
            return null;
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.8}
              style={styles.tabItem}>
              {renderIcon()}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    elevation: 0,
    zIndex: 100,
  },
  tabBarInner: {
    flexDirection: 'row',
    height: '100%',
    width: '100%',
    backgroundColor: Colors.tabBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    // Add top rounded corners and premium styling
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    // Native shadow and elevation guard
    ...Shadows.md,
    shadowOffset: { width: 0, height: -4 },
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
