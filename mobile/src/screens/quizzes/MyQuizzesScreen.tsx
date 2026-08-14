import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { quizService } from '../../services/quizService';
import { Quiz } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Colors, Typography, Spacing, Radius, Shadows, Gradients } from '../../theme';
import { useResponsiveSpacing } from '../../hooks/useResponsiveSpacing';
import { ScreenContainer } from '../../components/layout/ScreenContainer';

type FilterType = 'all' | 'not-attempted' | 'in-progress' | 'completed';

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All Quizzes' },
  { id: 'not-attempted', label: 'Not Attempted' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
];

const STATUS_CONFIG = {
  'not-attempted': { color: Colors.primary, bg: Colors.primarySoft, icon: '📝', label: 'Start Quiz' },
  'in-progress':   { color: Colors.warning, bg: Colors.warningSoft, icon: '⏱️', label: 'In Progress' },
  'completed':     { color: Colors.success, bg: Colors.successSoft, icon: '✅', label: 'Completed' },
};

const getCategoryIcon = (categoryName?: string) => {
  if (!categoryName) return '📝';
  const lower = categoryName.toLowerCase();
  if (lower.includes('basic')) return '📝';
  if (lower.includes('concept')) return '🧠';
  if (lower.includes('pyq') || lower.includes('previous')) return '📑';
  if (lower.includes('general') || lower.includes('exam') || lower.includes('test')) return '🏆';
  if (lower.includes('speed')) return '⚡';
  return '🏷️';
};

const QuizCard = ({
  quiz,
  onPress,
}: {
  quiz: Quiz;
  onPress: () => void;
}) => {
  const statusKey = quiz.status || 'not-attempted';
  const st = STATUS_CONFIG[statusKey];
  const catIcon = getCategoryIcon(quiz.categoryName);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Left indicator bar */}
      <View style={[styles.cardAccent, { backgroundColor: st.color }]} />

      <View style={styles.cardContent}>
        {/* Title and status badge */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>{quiz.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.color }]}>
              {st.icon} {statusKey === 'not-attempted' ? 'New' : statusKey === 'in-progress' ? 'In Progress' : 'Done'}
            </Text>
          </View>
        </View>

        {/* Course and Category Badges */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {quiz.courseName && (
            <View style={styles.courseChip}>
              <Text style={styles.courseChipText}>📚 {quiz.courseName}</Text>
            </View>
          )}
          {quiz.categoryName && (
            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{catIcon} {quiz.categoryName}</Text>
            </View>
          )}
          {quiz.subjectName && (
            <View style={styles.subjectChip}>
              <Text style={styles.subjectChipText}>🔬 {quiz.subjectName}</Text>
            </View>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statIcon}>⏱</Text>
            <Text style={styles.statVal}>{quiz.settings.timeLimit} min</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statIcon}>❓</Text>
            <Text style={styles.statVal}>{quiz.totalQuestions ?? quiz.questions?.length ?? '—'} Qs</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statVal}>{quiz.settings.passingPercentage}% pass</Text>
          </View>
          {quiz.status === 'completed' && quiz.lastPercentage != null && (
            <View style={[styles.stat, styles.scoreChip]}>
              <Text style={styles.scoreText}>
                {Math.round(quiz.lastPercentage)}%
              </Text>
            </View>
          )}
        </View>

        {/* Action Button Strip */}
        <View style={[styles.ctaRow, { backgroundColor: st.bg }]}>
          <Text style={[styles.ctaText, { color: st.color }]}>
            {quiz.status === 'in-progress' ? 'Resume Quiz →' :
             quiz.status === 'completed'   ? 'View Results →' : 'Attempt Quiz →'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const MyQuizzesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { insets, topInset, tabBarHeight } = useResponsiveSpacing();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuizzes = useCallback(async () => {
    try {
      setError(null);
      const res = await quizService.getAvailableQuizzes();
      setQuizzes(res.data || []);
    } catch (err: any) {
      setError(err.userMessage || 'Failed to load quizzes.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadQuizzes(); }, []);

  const onRefresh = () => { setRefreshing(true); loadQuizzes(); };

  // Unique subjects list
  const subjectList = Array.from(
    new Set(quizzes.map((q) => q.subjectName).filter((s): s is string => Boolean(s && s.trim())))
  );

  // Subject-filtered quizzes (for dynamic categories)
  const subjectFiltered = quizzes.filter((q) => {
    return selectedSubject === 'all' || q.subjectName === selectedSubject;
  });

  // Unique categories list for selected subject
  const categoryList = Array.from(
    new Set(subjectFiltered.map((q) => q.categoryName).filter((c): c is string => Boolean(c && c.trim())))
  );

  // Automatically select the first available real category
  useEffect(() => {
    if (categoryList.length > 0) {
      if (!selectedCategory || !categoryList.includes(selectedCategory)) {
        setSelectedCategory(categoryList[0]);
      }
    } else {
      setSelectedCategory('');
    }
  }, [categoryList, selectedCategory]);

  const filtered = quizzes.filter((q) => {
    const matchesStatus = filter === 'all' || q.status === filter;
    const matchesSubject = selectedSubject === 'all' || q.subjectName === selectedSubject;
    const matchesCategory = selectedCategory ? q.categoryName === selectedCategory : true;
    return matchesStatus && matchesSubject && matchesCategory;
  });

  const handlePress = (quiz: Quiz) => {
    if (!quiz || !quiz._id) {
      Alert.alert('Error', 'Invalid quiz selection.');
      return;
    }

    // In-progress: resume directly
    if (quiz.status === 'in-progress' && quiz.inProgressAttemptId) {
      navigation.navigate('QuizAttempt', {
        quizId: quiz._id,
        quizTitle: quiz.title || 'Quiz',
        attemptId: quiz.inProgressAttemptId,
      });
      return;
    }

    // Completed: show attempt picker ActionSheet
    if (quiz.status === 'completed' && quiz.allAttempts && quiz.allAttempts.length > 0) {
      const attempts = quiz.allAttempts;

      const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      const optionLabels = attempts.map(
        (a, i) =>
          `Attempt ${a.attemptNumber}${i === 0 ? ' (Latest)' : ''} – ${Math.round(a.percentage)}% – ${formatDate(a.attemptDate)}`
      );

      const navigateToAttempt = (idx: number) => {
        const selected = attempts[idx];
        navigation.navigate('QuizResult', {
          attemptId: selected.attemptId,
          quizId: quiz._id,
          quizTitle: quiz.title || 'Quiz',
          allowRetake: quiz.settings?.allowRetake ?? false,
        });
      };

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            title: `${quiz.title} — Select Attempt`,
            options: [...optionLabels, 'Cancel'],
            cancelButtonIndex: optionLabels.length,
          },
          (idx) => {
            if (idx < optionLabels.length) navigateToAttempt(idx);
          }
        );
      } else {
        // Android: use Alert with buttons (max 3 direct + cancel, overflow handled)
        const buttons = attempts.slice(0, 5).map((a, i) => ({
          text: `Attempt ${a.attemptNumber}${i === 0 ? ' ⭐' : ''} — ${Math.round(a.percentage)}%`,
          onPress: () => navigateToAttempt(i),
        }));
        buttons.push({ text: 'Cancel', onPress: () => {} } as any);
        Alert.alert(
          `${quiz.title}`,
          'Select an attempt to review:',
          buttons,
          { cancelable: true }
        );
      }
      return;
    }

    // Not attempted: start quiz
    navigation.navigate('QuizAttempt', {
      quizId: quiz._id,
      quizTitle: quiz.title || 'Quiz',
    });
  };

  if (isLoading) return <LoadingSpinner fullScreen message="Loading quizzes..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadQuizzes} />;

  const stats = {
    total: quizzes.length,
    done: quizzes.filter(q => q.status === 'completed').length,
    pending: quizzes.filter(q => q.status === 'not-attempted').length,
  };

  return (
    <ScreenContainer edges={['left', 'right']}>
      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Premium Header card */}
            <LinearGradient
              colors={Gradients.primary as [string, string]}
              style={[styles.header, { paddingTop: topInset + 16 }]}>
              <Text style={styles.headerTitle}>📋 My Quizzes</Text>
              <Text style={styles.headerSub}>Assess your knowledge and improve daily</Text>

              {/* Stats overview strip */}
              <View style={styles.statsStrip}>
                {[
                  { label: 'Total Quizzes', val: stats.total, icon: '📚' },
                  { label: 'Completed', val: stats.done, icon: '✅' },
                  { label: 'To Do', val: stats.pending, icon: '📝' },
                ].map(s => (
                  <View key={s.label} style={styles.stripItem}>
                    <Text style={styles.stripIcon}>{s.icon}</Text>
                    <Text style={styles.stripVal}>{s.val}</Text>
                    <Text style={styles.stripLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>

            {/* Subject Filter Chips */}
            {subjectList.length > 0 && (
              <View style={{ paddingHorizontal: Spacing.md, paddingTop: 14, paddingBottom: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
                  🧬 Quiz Subjects
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.chip, selectedSubject === 'all' && styles.chipActive]}
                    onPress={() => setSelectedSubject('all')}
                    activeOpacity={0.7}>
                    <Text style={[styles.chipText, selectedSubject === 'all' && styles.chipTextActive]}>
                      📚 All Subjects
                    </Text>
                  </TouchableOpacity>
                  {subjectList.map((sub) => (
                    <TouchableOpacity
                      key={sub}
                      style={[styles.chip, selectedSubject === sub && styles.chipActive]}
                      onPress={() => setSelectedSubject(sub)}
                      activeOpacity={0.7}>
                      <Text style={[styles.chipText, selectedSubject === sub && styles.chipTextActive]}>
                        {sub.toLowerCase().includes('bio') ? '🧬' : sub.toLowerCase().includes('chem') ? '⚗️' : sub.toLowerCase().includes('phys') ? '⚡' : sub.toLowerCase().includes('math') ? '📐' : '📚'} {sub}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Category Filter Chips — Real categories only, NO 'All Categories' */}
            {categoryList.length > 0 ? (
              <View style={{ paddingHorizontal: Spacing.md, paddingTop: 14, paddingBottom: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
                  🏷️ Quiz Categories
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {categoryList.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.7}>
                      <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                        {getCategoryIcon(cat)} {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : selectedSubject !== 'all' ? (
              <View style={{ paddingHorizontal: Spacing.md, paddingTop: 14, paddingBottom: 4 }}>
                <Text style={{ fontSize: 12, color: Colors.textMuted, fontStyle: 'italic' }}>
                  No quiz categories available for this subject.
                </Text>
              </View>
            ) : null}

            {/* Filter Pills */}
            <View style={styles.filterSection}>
              <FlatList
                horizontal
                data={FILTERS}
                keyExtractor={item => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.chip, filter === item.id && styles.chipActive]}
                    onPress={() => setFilter(item.id)}
                    activeOpacity={0.7}>
                    <Text style={[styles.chipText, filter === item.id && styles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </>
        }
        renderItem={({ item }) => (
          <QuizCard quiz={item} onPress={() => handlePress(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'No quizzes available' : `No matching quizzes`}
            </Text>
            <Text style={styles.emptySub}>
              {filter === 'all'
                ? 'Quizzes related to your enrolled courses will appear here.'
                : 'Try switching filters to view other quizzes.'}
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  // Header
  header: { paddingHorizontal: Spacing.md, paddingBottom: 24 },
  headerTitle: { ...Typography.h2, color: '#fff', marginBottom: 4 },
  headerSub: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.85)', marginBottom: 20 },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.md,
    padding: 14,
    gap: 8,
  },
  stripItem: { flex: 1, alignItems: 'center', gap: 2 },
  stripIcon: { fontSize: 18 },
  stripVal: { ...Typography.h3, color: '#fff', fontWeight: '800' },
  stripLabel: { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  
  // Filter chips
  filterSection: {
    paddingVertical: 14,
  },
  filterList: {
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.divider,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { 
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: { ...Typography.caption, fontWeight: '700', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },
  
  // Quiz card
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.md,
    marginBottom: 12,
    overflow: 'hidden',
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardAccent: { width: 5 },
  cardContent: { flex: 1, padding: 14 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: { ...Typography.h6, color: Colors.text, flex: 1, fontWeight: '700' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    flexShrink: 0,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  courseName: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 8, fontWeight: '500' },
  courseChip: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  courseChipText: { fontSize: 11, color: '#4F46E5', fontWeight: '700' },
  categoryChip: { backgroundColor: '#FDF2F8', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#FBCFE8' },
  categoryChipText: { fontSize: 11, color: '#DB2777', fontWeight: '800' },
  subjectChip: { backgroundColor: '#F3E8FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  subjectChipText: { fontSize: 11, color: '#7E22CE', fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  scoreChip: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    marginLeft: 'auto',
  },
  scoreText: { ...Typography.caption, color: '#fff', fontWeight: '800' },
  statIcon: { fontSize: 12 },
  statVal: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  ctaRow: { borderRadius: Radius.xs, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-start' },
  ctaText: { ...Typography.caption, fontWeight: '700' },
  
  // Empty
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 60, marginBottom: 12 },
  emptyTitle: { ...Typography.h5, color: Colors.text, marginBottom: 6, fontWeight: '700' },
  emptySub: { ...Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },
});
