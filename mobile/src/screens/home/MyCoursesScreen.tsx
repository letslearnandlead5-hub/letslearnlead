import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { courseService } from '../../services/courseService';
import { enrollmentService } from '../../services/enrollmentService';
import { Course } from '../../types';
import { MyCourseCard } from '../../components/ui/MyCourseCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Colors, Typography, Spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';

export const MyCoursesScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEnrolledCourses = useCallback(async () => {
    try {
      setError(null);
      const response = await courseService.getEnrolledCourses();
      const enrolledCourses = response.data || [];
      
      // Fetch progress for each course
      const coursesWithProgress = await Promise.all(
        enrolledCourses.map(async (course: any) => {
          try {
            const progressData = await enrollmentService.getCourseProgress(course._id);
            
            // Calculate total VIDEO lessons only (not documents or quizzes)
            const totalLessons = course.sections?.reduce((total: number, section: any) => {
              return total + (section.subsections?.reduce((subTotal: number, subsection: any) => {
                const videoCount = subsection.content?.filter((c: any) => c.type === 'video').length || 0;
                return subTotal + videoCount;
              }, 0) || 0);
            }, 0) || 0;
            
            const completedCount = progressData.completedLessons?.length || 0;
            // Calculate actual percentage from completed lessons (ignore backend if inconsistent)
            const actualPercentage = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;
            
            return {
              ...course,
              completionPercentage: actualPercentage,
              completedLessons: completedCount,
              totalLessons,
            };
          } catch (err) {
            // If progress fetch fails, return course with 0 progress
            const totalLessons = course.sections?.reduce((total: number, section: any) => {
              return total + (section.subsections?.reduce((subTotal: number, subsection: any) => {
                const videoCount = subsection.content?.filter((c: any) => c.type === 'video').length || 0;
                return subTotal + videoCount;
              }, 0) || 0);
            }, 0) || 0;
            
            return {
              ...course,
              completionPercentage: 0,
              completedLessons: 0,
              totalLessons,
            };
          }
        })
      );
      
      setCourses(coursesWithProgress);
    } catch (err: any) {
      setError(err.userMessage || 'Failed to load your courses.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEnrolledCourses();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEnrolledCourses();
  }, [loadEnrolledCourses]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'Student';

  if (isLoading) return <LoadingSpinner fullScreen message="Loading your courses..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadEnrolledCourses} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <FlatList
        data={courses}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[
          styles.list,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* Greeting Card */}
            <LinearGradient
              colors={['#4F46E5', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.greetingCard}>
              <Text style={styles.greetingText}>{getGreeting()} 👋</Text>
              <Text style={styles.userName}>{firstName}</Text>
              <Text style={styles.greetingSubtext}>Continue your learning journey</Text>
            </LinearGradient>

            {/* Section Title */}
            <View style={styles.titleSection}>
              <View>
                <Text style={styles.sectionTitle}>📚 My Courses</Text>
                <Text style={styles.sectionSubtitle}>
                  {courses.length} {courses.length === 1 ? 'course' : 'courses'} in progress
                </Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📚</Text>
              <Text style={styles.emptyTitle}>No courses yet</Text>
              <Text style={styles.emptySubtext}>
                Start learning today and unlock your potential!
              </Text>
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => navigation.navigate('HomeTab')}
                activeOpacity={0.8}>
                <LinearGradient
                  colors={['#4F46E5', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.browseButtonGradient}>
                  <Text style={styles.browseButtonText}>Browse Courses</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <MyCourseCard
            course={item}
            onPress={(course) =>
              navigation.navigate('CourseDetail', {
                courseId: course._id,
                courseTitle: course.title,
              })
            }
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4F46E5"
            colors={['#4F46E5']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB',
  },
  list: { 
    paddingHorizontal: Spacing.md,
  },
  headerSection: {
    marginBottom: Spacing.lg,
  },
  greetingCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: Spacing.lg,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  greetingSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyEmoji: { 
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: { 
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: { 
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  browseButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  browseButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
