import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeStackParamList, Notification } from '../../types';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme';
import { notificationService } from '../../services/notificationService';

type Props = NativeStackScreenProps<HomeStackParamList, 'Notifications'>;

export const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      if (response.success && response.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      // Mark as read
      if (!notification.read) {
        await notificationService.markRead(notification._id);
        setNotifications(prev =>
          prev.map(n => (n._id === notification._id ? { ...n, read: true } : n))
        );
      }

      // Navigate if there's a link
      if (notification.link) {
        // Parse the link and navigate accordingly
        if (notification.link.includes('/courses/')) {
          // Extract course ID from link (handles both /courses/123 and /courses/123/video)
          const courseIdMatch = notification.link.match(/\/courses\/([^\/]+)/);
          if (courseIdMatch && courseIdMatch[1]) {
            const courseId = courseIdMatch[1];
            navigation.navigate('CourseDetail', { 
              courseId, 
              courseTitle: notification.title 
            });
          }
        } else if (notification.link.includes('/video/')) {
          // Handle video player navigation
          const videoMatch = notification.link.match(/\/courses\/([^\/]+)\/video\/([^\/]+)/);
          if (videoMatch && videoMatch[1] && videoMatch[2]) {
            navigation.navigate('VideoPlayer', {
              courseId: videoMatch[1],
              lessonId: videoMatch[2],
              lessonTitle: notification.title,
            });
          }
        } else if (notification.link.includes('/categories/')) {
          // Handle category navigation
          const categoryMatch = notification.link.match(/\/categories\/([^\/]+)/);
          if (categoryMatch && categoryMatch[1]) {
            navigation.navigate('CategoryCourses', {
              categoryId: categoryMatch[1],
              categoryName: notification.title,
            });
          }
        }
      } else {
        // No link - open detail screen to read full message
        navigation.navigate('NotificationDetail', { notification });
      }
    } catch (error) {
      console.error('Failed to handle notification press:', error);
    }
  };

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

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${getNotificationColor(item.type)}20` },
        ]}>
        <Text style={styles.icon}>{getNotificationIcon(item.type)}</Text>
      </View>
      <View style={styles.notificationContent}>
        <Text style={[styles.title, !item.read && styles.unreadTitle]}>
          {item.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.time}>
          {new Date(item.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
      {item.link && (
        <View style={styles.linkIndicator}>
          <Text style={styles.linkArrow}>→</Text>
        </View>
      )}
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={async () => {
            try {
              await notificationService.markAllRead();
              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            } catch (error) {
              console.error('Failed to mark all as read:', error);
            }
          }}>
          <Text style={styles.markAllReadText}>✓</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderNotification}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 16 },
          ]}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyMessage}>
            You'll see notifications about your courses and activities here
          </Text>
        </View>
      )}
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
  markAllReadText: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '700',
  },
  list: {
    padding: Spacing.md,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  unreadCard: {
    backgroundColor: `${Colors.primary}08`,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  icon: {
    fontSize: 24,
  },
  notificationContent: {
    flex: 1,
  },
  title: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  message: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  time: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginLeft: Spacing.sm,
    alignSelf: 'center',
  },
  linkIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
    alignSelf: 'center',
  },
  linkArrow: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyMessage: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
