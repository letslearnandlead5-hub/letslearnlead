import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeStackParamList } from '../../types';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'NotificationDetail'>;

export const NotificationDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { notification } = route.params;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return Colors.success;
      case 'warning':
        return Colors.warning;
      case 'error':
        return Colors.error;
      default:
        return Colors.primary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Icon and Type */}
        <View style={styles.iconSection}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${getNotificationColor(notification.type)}20` },
            ]}>
            <Text style={styles.icon}>{getNotificationIcon(notification.type)}</Text>
          </View>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: `${getNotificationColor(notification.type)}15` },
            ]}>
            <Text
              style={[
                styles.typeText,
                { color: getNotificationColor(notification.type) },
              ]}>
              {notification.type.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{notification.title}</Text>

        {/* Date */}
        <Text style={styles.date}>{formatDate(notification.createdAt)}</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.messageLabel}>Message</Text>
          <Text style={styles.message}>{notification.message}</Text>
        </View>

        {/* Action Button (if link exists) */}
        {notification.link && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // Navigate back and let the NotificationsScreen handle the link
              navigation.goBack();
              setTimeout(() => {
                // Re-trigger the navigation with the link
                if (notification.link?.includes('/courses/')) {
                  const courseIdMatch = notification.link.match(/\/courses\/([^\/]+)/);
                  if (courseIdMatch && courseIdMatch[1]) {
                    navigation.navigate('CourseDetail', {
                      courseId: courseIdMatch[1],
                      courseTitle: notification.title,
                    });
                  }
                } else if (notification.link?.includes('/categories/')) {
                  const categoryMatch = notification.link.match(/\/categories\/([^\/]+)/);
                  if (categoryMatch && categoryMatch[1]) {
                    navigation.navigate('CategoryCourses', {
                      categoryId: categoryMatch[1],
                      categoryName: notification.title,
                    });
                  }
                }
              }, 100);
            }}>
            <Text style={styles.actionButtonText}>View Related Content</Text>
            <Text style={styles.actionButtonIcon}>→</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  backIcon: {
    fontSize: 24,
    color: Colors.text,
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  icon: {
    fontSize: 40,
  },
  typeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  typeText: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  date: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginBottom: Spacing.xl,
  },
  messageContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  messageLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    ...Shadows.md,
  },
  actionButtonText: {
    ...Typography.button,
    color: Colors.textOnPrimary,
    fontWeight: '700',
    marginRight: Spacing.sm,
  },
  actionButtonIcon: {
    fontSize: 18,
    color: Colors.textOnPrimary,
    fontWeight: '700',
  },
});
