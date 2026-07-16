import React from 'react';
import { View, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  AppTabParamList,
  HomeStackParamList,
  MyCoursesStackParamList,
  QuizzesStackParamList,
  DoubtsStackParamList,
  ProfileStackParamList,
} from '../types';

// ── Screens ──────────────────────────────────────────────────────────────────
import { HomeScreen } from '../screens/home/HomeScreen';
import { MyCoursesScreen } from '../screens/home/MyCoursesScreen';
import { CategoriesScreen } from '../screens/categories/CategoriesScreen';
import { CategoryCoursesScreen } from '../screens/categories/CategoryCoursesScreen';
import { CourseDetailScreen } from '../screens/courses/CourseDetailScreen';
import { SubjectSelectionScreen } from '../screens/courses/SubjectSelectionScreen';
import { VideoPlayerScreen } from '../screens/courses/VideoPlayerScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { NotificationDetailScreen } from '../screens/notifications/NotificationDetailScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import { MyQuizzesScreen } from '../screens/quizzes/MyQuizzesScreen';
import { QuizAttemptScreen } from '../screens/quizzes/QuizAttemptScreen';
import { MyDoubtsScreen } from '../screens/doubts/MyDoubtsScreen';
import { NotesScreen } from '../screens/notes/NotesScreen';
import { CertificatesScreen } from '../screens/certificates/CertificatesScreen';
import { MyPaymentsScreen } from '../screens/payments/MyPaymentsScreen';
import { PaymentSubmitScreen } from '../screens/payments/PaymentSubmitScreen';
import { Colors, Shadows } from '../theme';

// ─── Home Stack ──────────────────────────────────────────────────────────────
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackNavigator = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
    <HomeStack.Screen name="Home" component={HomeScreen} />
    <HomeStack.Screen name="Search" component={SearchScreen} options={{ animation: 'slide_from_right' }} />
    <HomeStack.Screen name="Categories" component={CategoriesScreen} options={{ animation: 'slide_from_right' }} />
    <HomeStack.Screen name="CategoryCourses" component={CategoryCoursesScreen} options={{ animation: 'slide_from_right' }} />
    <HomeStack.Screen name="CourseDetail" component={CourseDetailScreen} options={{ animation: 'slide_from_right' }} />
    <HomeStack.Screen name="SubjectSelection" component={SubjectSelectionScreen} options={{ animation: 'slide_from_right' }} />
    <HomeStack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ animation: 'slide_from_bottom' }} />
    <HomeStack.Screen name="Notifications" component={NotificationsScreen} options={{ animation: 'slide_from_right' }} />
    <HomeStack.Screen name="NotificationDetail" component={NotificationDetailScreen} options={{ animation: 'slide_from_right' }} />
    <HomeStack.Screen name="PaymentSubmit" component={PaymentSubmitScreen} options={{ animation: 'slide_from_right' }} />
  </HomeStack.Navigator>
);

// ─── My Courses Stack ─────────────────────────────────────────────────────────
const MyCoursesStack = createNativeStackNavigator<MyCoursesStackParamList>();

const MyCoursesStackNavigator = () => (
  <MyCoursesStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
    <MyCoursesStack.Screen name="MyCoursesList" component={MyCoursesScreen} />
    <MyCoursesStack.Screen name="CourseDetail" component={CourseDetailScreen} options={{ animation: 'slide_from_right' }} />
    <MyCoursesStack.Screen name="SubjectSelection" component={SubjectSelectionScreen} options={{ animation: 'slide_from_right' }} />
    <MyCoursesStack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ animation: 'slide_from_bottom' }} />
    <MyCoursesStack.Screen name="PaymentSubmit" component={PaymentSubmitScreen} options={{ animation: 'slide_from_right' }} />
  </MyCoursesStack.Navigator>
);

// ─── Practice / Quizzes Stack ──────────────────────────────────────────────────
const QuizzesStack = createNativeStackNavigator<QuizzesStackParamList>();

const QuizzesStackNavigator = () => (
  <QuizzesStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
    <QuizzesStack.Screen name="QuizzesList" component={MyQuizzesScreen} />
    <QuizzesStack.Screen name="QuizAttempt" component={QuizAttemptScreen} options={{ animation: 'slide_from_right' }} />
  </QuizzesStack.Navigator>
);

// ─── Doubts Stack ─────────────────────────────────────────────────────────────
const DoubtsStack = createNativeStackNavigator<DoubtsStackParamList>();

const DoubtsStackNavigator = () => (
  <DoubtsStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
    <DoubtsStack.Screen name="DoubtsList" component={MyDoubtsScreen} />
  </DoubtsStack.Navigator>
);

// ─── Profile & Hub Stack ───────────────────────────────────────────────────────
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
    <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
    <ProfileStack.Screen name="CertificatesList" component={CertificatesScreen} options={{ animation: 'slide_from_right' }} />
    <ProfileStack.Screen name="PaymentsList" component={MyPaymentsScreen} options={{ animation: 'slide_from_right' }} />
    <ProfileStack.Screen name="PaymentSubmit" component={PaymentSubmitScreen} options={{ animation: 'slide_from_right' }} />
    <ProfileStack.Screen name="NotesList" component={NotesScreen} options={{ animation: 'slide_from_right' }} />
  </ProfileStack.Navigator>
);

import { ResponsiveTabBar } from '../components/layout/ResponsiveTabBar';
import { useAuthStore } from '../store/useAuthStore';
import { useAuthModalStore } from '../store/useAuthModalStore';

// ─── Tab Icon ─────────────────────────────────────────────────────────────────
const TabIcon = ({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) => (
  <View style={{ alignItems: 'center', gap: 3 }}>
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>
    <Text style={{ fontSize: 10, color: focused ? Colors.tabActive : Colors.tabInactive, fontWeight: focused ? '700' : '500' }}>
      {label}
    </Text>
  </View>
);

const protectedTabListener = (tabName: keyof AppTabParamList) => ({
  tabPress: (e: any) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) {
      e.preventDefault();
      useAuthModalStore.getState().openModal({ name: tabName });
    }
  },
});

// ─── Bottom Tabs ──────────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator<AppTabParamList>();

export const AppNavigator = () => (
  <Tab.Navigator
    tabBar={(props) => <ResponsiveTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}>
    <Tab.Screen
      name="HomeTab"
      component={HomeStackNavigator}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} /> }}
    />
    <Tab.Screen
      name="MyCoursesTab"
      component={MyCoursesStackNavigator}
      listeners={protectedTabListener('MyCoursesTab')}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📚" label="My Courses" focused={focused} /> }}
    />
    <Tab.Screen
      name="PracticeTab"
      component={QuizzesStackNavigator}
      listeners={protectedTabListener('PracticeTab')}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="Practice" focused={focused} /> }}
    />
    <Tab.Screen
      name="DoubtsTab"
      component={DoubtsStackNavigator}
      listeners={protectedTabListener('DoubtsTab')}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="💬" label="Doubts" focused={focused} /> }}
    />
    <Tab.Screen
      name="ProfileTab"
      component={ProfileStackNavigator}
      listeners={protectedTabListener('ProfileTab')}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} /> }}
    />
  </Tab.Navigator>
);
