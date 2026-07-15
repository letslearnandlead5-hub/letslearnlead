import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeStackParamList, CourseSubject, Course } from '../../types';
import { courseService } from '../../services/courseService';
import { enrollmentService } from '../../services/enrollmentService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Colors, Spacing } from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'SubjectSelection'>;

// ─── Helper: count video lessons in a subject ─────────────────────────────────
const countSubjectLessons = (subject: CourseSubject): number => {
  let count = 0;
  for (const section of subject.sections || []) {
    for (const sub of section.subsections || []) {
      count += sub.content?.filter(c => c.type === 'video').length || 0;
    }
  }
  return count;
};

// ─── Helper: count completed lessons in a subject from completedIds set ────────
const countSubjectCompleted = (subject: CourseSubject, completedIds: Set<string>): number => {
  let count = 0;
  for (const section of subject.sections || []) {
    for (const sub of section.subsections || []) {
      for (const item of sub.content || []) {
        if (completedIds.has(item._id)) count++;
      }
    }
  }
  return count;
};

// ─── Subject Card ─────────────────────────────────────────────────────────────
const SubjectCard = ({
  subject,
  completed,
  total,
  onPress,
}: {
  subject: CourseSubject;
  completed: number;
  total: number;
  onPress: () => void;
}) => {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = pct === 100;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Icon circle */}
      <LinearGradient
        colors={isComplete ? ['#22C55E', '#16A34A'] : ['#4F46E5', '#6366F1']}
        style={styles.iconCircle}>
        <Text style={styles.iconText}>{subject.icon || '📖'}</Text>
      </LinearGradient>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{subject.name}</Text>
          {isComplete && <Text style={styles.completeBadge}>✓ Done</Text>}
        </View>
        {subject.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>{subject.description}</Text>
        ) : null}

        {/* Progress */}
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>{completed}/{total} lessons</Text>
          <Text style={styles.progressPct}>{pct}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: isComplete ? '#22C55E' : '#4F46E5' }]} />
        </View>
      </View>

      {/* Arrow */}
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export const SubjectSelectionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { courseId, courseTitle } = route.params;
  const insets = useSafeAreaInsets();

  const [course, setCourse] = useState<Course | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [courseRes, progressRes] = await Promise.all([
        courseService.getCourseById(courseId),
        enrollmentService.getCourseProgress(courseId).catch(() => ({ completedLessons: [] as string[], completionPercentage: 0 })),
      ]);

      if (courseRes.success && courseRes.data) {
        setCourse(courseRes.data);
      }
      if (progressRes.completedLessons?.length) {
        setCompletedIds(new Set(progressRes.completedLessons));
      }
    } catch (err: any) {
      setError(err.userMessage || 'Failed to load subjects.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [courseId]);

  useEffect(() => { loadData(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleSubjectPress = (subject: CourseSubject) => {
    // Find the first incomplete (or first) video lesson in this subject
    let firstLessonId = '';
    let firstLessonTitle = '';

    for (const section of subject.sections || []) {
      for (const sub of section.subsections || []) {
        for (const item of sub.content || []) {
          if (item.type === 'video') {
            if (!completedIds.has(item._id) && !firstLessonId) {
              // prefer first incomplete lesson
              firstLessonId = item._id;
              firstLessonTitle = item.title;
            } else if (!firstLessonId) {
              firstLessonId = item._id;
              firstLessonTitle = item.title;
            }
          }
        }
      }
    }

    if (!firstLessonId) {
      Alert.alert('No Lessons', 'No video lessons found in this subject.');
      return;
    }

    navigation.navigate('VideoPlayer', {
      courseId,
      lessonId: firstLessonId,
      lessonTitle: firstLessonTitle,
      subjectId: subject._id,
    });
  };

  if (isLoading) return <LoadingSpinner fullScreen message="Loading subjects..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  const subjects = course?.subjects || [];

  // Calculate overall course progress
  const totalLessons = subjects.reduce((acc, s) => acc + countSubjectLessons(s), 0);
  const completedCount = completedIds.size;
  const overallPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" translucent />

      <FlatList
        data={subjects}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        ListHeaderComponent={
          <>
            {/* Header */}
            <LinearGradient
              colors={['#4F46E5', '#6366F1']}
              style={[styles.header, { paddingTop: insets.top + 16 }]}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={styles.backText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle} numberOfLines={2}>{courseTitle || 'Select Subject'}</Text>
              <Text style={styles.headerSub}>{subjects.length} subjects • {overallPct}% complete</Text>
              {/* Overall progress bar */}
              <View style={styles.overallTrack}>
                <View style={[styles.overallFill, { width: `${overallPct}%` as any }]} />
              </View>
            </LinearGradient>
            <Text style={styles.listLabel}>Choose a subject to continue</Text>
          </>
        }
        renderItem={({ item }) => {
          const total = countSubjectLessons(item);
          const completed = countSubjectCompleted(item, completedIds);
          return (
            <SubjectCard
              subject={item}
              completed={completed}
              total={total}
              onPress={() => handleSubjectPress(item)}
            />
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  // ── Header ───────────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  backText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 30,
  },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 14 },
  overallTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  overallFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  listLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  // ── Subject Card ─────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: { fontSize: 26 },
  cardInfo: { flex: 1 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, flex: 1 },
  completeBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#22C55E',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  cardDesc: { fontSize: 12, color: Colors.textSecondary, marginBottom: 8, lineHeight: 17 },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  progressLabel: { fontSize: 11, color: Colors.textMuted },
  progressPct: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },
  progressTrack: {
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  arrow: { fontSize: 26, color: Colors.textMuted, fontWeight: '300' },
});
