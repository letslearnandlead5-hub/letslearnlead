import React from 'react';
import { View, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppTabParamList, HomeStackParamList, MyCoursesStackParamList } from '../types';
import { HomeScreen } from '../screens/home/HomeScreen';
import { MyCoursesScreen } from '../screens/home/MyCoursesScreen';
import { CategoriesScreen } from '../screens/categories/CategoriesScreen';
import { CategoryCoursesScreen } from '../screens/categories/CategoryCoursesScreen';
import { CourseDetailScreen } from '../screens/courses/CourseDetailScreen';
import { VideoPlayerScreen } from '../screens/courses/VideoPlayerScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { NotificationDetailScreen } from '../screens/notifications/NotificationDetailScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import { Colors, Shadows } from '../theme';

// ─── Home Stack ──────────────────────────────────────────────────────────────
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackNavigator = () => (
  <HomeStack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: Colors.background },
    }}>
    <HomeStack.Screen name="Home" component={HomeScreen} />
    <HomeStack.Screen
      name="Search"
      component={SearchScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <HomeStack.Screen
      name="Categories"
      component={CategoriesScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <HomeStack.Screen
      name="CategoryCourses"
      component={CategoryCoursesScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <HomeStack.Screen
      name="CourseDetail"
      component={CourseDetailScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <HomeStack.Screen
      name="VideoPlayer"
      component={VideoPlayerScreen}
      options={{ animation: 'slide_from_bottom' }}
    />
    <HomeStack.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <HomeStack.Screen
      name="NotificationDetail"
      component={NotificationDetailScreen}
      options={{ animation: 'slide_from_right' }}
    />
  </HomeStack.Navigator>
);

// ─── My Courses Stack ─────────────────────────────────────────────────────────
const MyCoursesStack = createNativeStackNavigator<MyCoursesStackParamList>();

const MyCoursesStackNavigator = () => (
  <MyCoursesStack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: Colors.background },
    }}>
    <MyCoursesStack.Screen name="MyCoursesList" component={MyCoursesScreen} />
    <MyCoursesStack.Screen
      name="CourseDetail"
      component={CourseDetailScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <MyCoursesStack.Screen
      name="VideoPlayer"
      component={VideoPlayerScreen}
      options={{ animation: 'slide_from_bottom' }}
    />
  </MyCoursesStack.Navigator>
);

// ─── Tab Icon ─────────────────────────────────────────────────────────────────
const TabIcon = ({
  emoji,
  label,
  focused,
}: {
  emoji: string;
  label: string;
  focused: boolean;
}) => (
  <View style={{ alignItems: 'center', gap: 2 }}>
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
    <Text
      style={{
        fontSize: 10,
        color: focused ? Colors.primary : Colors.textMuted,
        fontWeight: focused ? '600' : '400',
      }}>
      {label}
    </Text>
  </View>
);

// ─── Bottom Tabs ──────────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator<AppTabParamList>();

export const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          height: Platform.OS === 'ios' ? 84 : 64,
          ...Shadows.md,
        },
      }}>
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="MyCoursesTab"
        component={MyCoursesStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📚" label="My Courses" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
