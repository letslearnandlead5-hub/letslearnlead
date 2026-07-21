import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
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

const QuizCard = ({
  quiz,
  onPress,
}: {
  quiz: Quiz;
  onPress: () => void;
}) => {
  const statusKey = quiz.status || 'not-attempted';
  const st = STATUS_CONFIG[statusKey];

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

        {quiz.courseName && (
          <Text style={styles.courseName}>📚 {quiz.courseName}</Text>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statIcon}>⏱</Text>
            <Text style={styles.statVal}>{quiz.settings.timeLimit} min</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statIcon}>❓</Text>
            <Text style={styles.statVal}>{quiz.questions?.length || '—'} Qs</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statVal}>{quiz.settings.passingScore}% pass</Text>
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

  const filtered = filter === 'all'
    ? quizzes
    : quizzes.filter(q => q.status === filter);

  const handlePress = (quiz: Quiz) => {
    if (!quiz || !quiz._id) {
      Alert.alert('Error', 'Invalid quiz selection.');
      return;
    }
    navigation.navigate('QuizAttempt', {
      quizId: quiz._id,
      quizTitle: quiz.title || 'Quiz',
      attemptId: quiz.status === 'in-progress' ? quiz.inProgressAttemptId : undefined,
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
