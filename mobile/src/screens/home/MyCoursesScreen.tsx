import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { enrollmentService } from '../../services/enrollmentService';
import { Enrollment, Course, CourseSubject } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Colors, Typography, Spacing } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsiveSpacing } from '../../hooks/useResponsiveSpacing';
import { ScreenContainer } from '../../components/layout/ScreenContainer';

// ─── Helper: count all lessons inside a course (subjects or legacy sections) ──
const countAllLessons = (course: Course): { total: number } => {
  let total = 0;
  // New schema: subjects[].sections[].subsections[].content[]
  if (course.subjects?.length) {
    for (const subject of course.subjects) {
      for (const section of subject.sections || []) {
        for (const subsection of section.subsections || []) {
          total += subsection.content?.length || 0;
        }
      }
    }
  } else {
    // Legacy schema: sections[].subsections[].content[]
    for (const section of course.sections || []) {
      for (const subsection of section.subsections || []) {
        total += subsection.content?.length || 0;
      }
    }
  }
  return { total };
};

// ─── Enrollment card (one per enrolled course) ────────────────────────────────
const EnrollmentCard = ({
  enrollment,
  onPress,
}: {
  enrollment: Enrollment;
  onPress: () => void;
}) => {
  const course = enrollment.courseId as Course;
  const { total } = countAllLessons(course);
  const completed = enrollment.completedLessons?.length || 0;
  const pct = enrollment.completionPercentage || 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Thumbnail */}
      {course.thumbnail ? (
        <Image source={{ uri: course.thumbnail }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <LinearGradient colors={['#4F46E5', '#6366F1']} style={styles.thumb} />
      )}

      {/* Info */}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{course.title}</Text>
        <Text style={styles.cardSub}>{course.instructor}</Text>

        {/* Progress */}
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>{completed}/{total} lessons</Text>
          <Text style={styles.progressPct}>{Math.round(pct)}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%` as any }]} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export const MyCoursesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { insets, topInset, tabBarHeight } = useResponsiveSpacing();
  const user = useAuthStore((state) => state.user);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEnrollments = useCallback(async () => {
    try {
      setError(null);
      // ✅ Correct endpoint: /api/enrollment/my-enrollments
      const response = await enrollmentService.getMyEnrollments();
      // Filter to only paid enrollments that have a populated courseId object
      const paid = (response.data || []).filter(
        (e: any) => e.status === 'paid' && typeof e.courseId === 'object'
      );
      setEnrollments(paid);
    } catch (err: any) {
      setError(err.userMessage || 'Failed to load your courses.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEnrollments();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEnrollments();
  }, [loadEnrollments]);

  const handleCoursePress = (enrollment: Enrollment) => {
    const course = enrollment.courseId as Course;
    // If the course has multiple subjects → go to SubjectSelection hub
    if (course.subjects && course.subjects.length > 1) {
      navigation.navigate('SubjectSelection', {
        courseId: course._id,
        courseTitle: course.title,
      });
    } else {
      // Single-subject or legacy course → go to CourseDetail
      navigation.navigate('CourseDetail', {
        courseId: course._id,
        courseTitle: course.title,
      });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'Student';

  if (isLoading) return <LoadingSpinner fullScreen message="Loading your courses..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadEnrollments} />;

  return (
    <ScreenContainer edges={['left', 'right']}>
      <FlatList
        data={enrollments}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[
          styles.list,
          { paddingTop: topInset + 16, paddingBottom: tabBarHeight + 16 },
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
                  {enrollments.length} {enrollments.length === 1 ? 'course' : 'courses'} enrolled
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
          <EnrollmentCard
            enrollment={item}
            onPress={() => handleCoursePress(item)}
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
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  list: { paddingHorizontal: Spacing.md },
  headerSection: { marginBottom: Spacing.lg },
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
  greetingText: { fontSize: 16, fontWeight: '500', color: 'rgba(255,255,255,0.9)', marginBottom: 4 },
  userName: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  greetingSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: Colors.textSecondary },
  // ── Enrollment Card ──────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  thumb: {
    width: 100,
    height: 100,
  },
  cardBody: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  cardSub: { fontSize: 12, color: Colors.textSecondary, marginBottom: 8 },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: { fontSize: 11, color: Colors.textMuted },
  progressPct: { fontSize: 11, color: '#4F46E5', fontWeight: '700' },
  progressTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 3,
  },
  // ── Empty state ──────────────────────────────────────────────────────────────
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
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
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptySubtext: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  browseButton: { borderRadius: 12, overflow: 'hidden', width: '100%' },
  browseButtonGradient: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  browseButtonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', letterSpacing: 0.3 },
});
