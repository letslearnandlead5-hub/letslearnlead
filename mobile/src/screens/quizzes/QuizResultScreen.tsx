import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { QuizzesStackParamList, QuestionResult } from '../../types';
import { quizService } from '../../services/quizService';
import { MathText } from '../../components/ui/MathText';
import { Colors } from '../../theme';

// ─── HTML strip helper ────────────────────────────────────────────────────────
const ENTITY_MAP: Record<string, string> = {
  '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>',
  '&quot;': '"', '&#39;': "'", '&apos;': "'",
  '&hellip;': '\u2026', '&mdash;': '\u2014', '&ndash;': '\u2013',
};

function stripHtml(html?: string): string {
  if (!html || typeof html !== 'string') return '';
  let text = html.replace(/&[a-zA-Z]+;/g, (e) => ENTITY_MAP[e] ?? e);
  text = text.replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c, 10)));
  text = text.replace(/<\/(p|div|li)>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.split('\n').map(l => l.trim()).join('\n').trim();
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function getGrade(pct: number): string {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

type Props = NativeStackScreenProps<QuizzesStackParamList, 'QuizResult'>;

type FilterMode = 'all' | 'correct' | 'incorrect' | 'skipped';

const FILTERS: { id: FilterMode; label: string; emoji: string }[] = [
  { id: 'all', label: 'All', emoji: '📋' },
  { id: 'correct', label: 'Correct', emoji: '✅' },
  { id: 'incorrect', label: 'Wrong', emoji: '❌' },
  { id: 'skipped', label: 'Skipped', emoji: '⏭' },
];

// ─── Question Card ────────────────────────────────────────────────────────────
const QuestionCard = ({
  qr,
  index,
}: {
  qr: QuestionResult;
  index: number;
}) => {
  const [expanded, setExpanded] = useState(false);

  const borderColor = qr.isCorrect ? '#22C55E'
    : qr.selectedAnswer ? '#EF4444'
    : '#9CA3AF';

  const marks = qr.isCorrect ? `+${qr.marksAwarded}` : qr.marksAwarded < 0 ? `${qr.marksAwarded}` : '0';
  const marksColor = qr.isCorrect ? '#16A34A' : qr.marksAwarded < 0 ? '#DC2626' : '#6B7280';

  return (
    <View style={[styles.qCard, { borderLeftColor: borderColor }]}>
      {/* Header row */}
      <View style={styles.qCardHeader}>
        <View style={[styles.qBadge, { backgroundColor: borderColor + '22', borderColor }]}>
          <Text style={[styles.qBadgeText, { color: borderColor }]}>Q{index + 1}</Text>
        </View>
        <View style={styles.qCardHeaderCenter}>
          <Text style={styles.statusTag}>
            {qr.isCorrect ? '✅ Correct' : qr.selectedAnswer ? '❌ Wrong' : '⏭ Skipped'}
          </Text>
        </View>
        <Text style={[styles.marksTag, { color: marksColor }]}>{marks} marks</Text>
      </View>

      {/* Question text */}
      <MathText content={qr.questionText} style={styles.qText} fontSize={15} />

      {/* Answers */}
      <View style={styles.answersSection}>
        {qr.selectedAnswer ? (
          <View style={styles.answerRow}>
            <Text style={styles.answerLabel}>Your answer:</Text>
            <View style={{ flex: 1 }}>
              <MathText
                content={qr.selectedAnswer}
                style={[styles.answerValue, { color: qr.isCorrect ? '#16A34A' : '#DC2626' }]}
                fontSize={13}
              />
            </View>
          </View>
        ) : (
          <Text style={styles.skippedText}>Not answered</Text>
        )}

        {!qr.isCorrect && qr.correctAnswer && qr.correctAnswer !== 'match' && (
          <View style={styles.answerRow}>
            <Text style={styles.answerLabel}>Correct answer:</Text>
            <View style={{ flex: 1 }}>
              <MathText
                content={qr.correctAnswer}
                style={[styles.answerValue, { color: '#16A34A' }]}
                fontSize={13}
              />
            </View>
          </View>
        )}
      </View>

      {/* Explanation toggle */}
      {qr.explanation ? (
        <>
          <TouchableOpacity
            style={styles.explainToggle}
            onPress={() => setExpanded(e => !e)}
            activeOpacity={0.7}
          >
            <Text style={styles.explainToggleText}>
              {expanded ? '▲ Hide Explanation' : '▼ Show Explanation'}
            </Text>
          </TouchableOpacity>
          {expanded && (
            <View style={styles.explainBox}>
              <Text style={styles.explainTitle}>📖 Explanation</Text>
              <MathText content={qr.explanation} style={styles.explainText} fontSize={13} />
            </View>
          )}
        </>
      ) : null}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const QuizResultScreen: React.FC<Props> = ({ route, navigation }) => {
  const { attemptId, quizId, quizTitle = 'Quiz Result', allowRetake } = route.params;
  const insets = useSafeAreaInsets();

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const loadResult = useCallback(async () => {
    try {
      setLoading(true);
      const res = await quizService.getResult(attemptId);
      setResult(res.data?.result ?? res.data);
    } catch (err: any) {
      console.error('[QUIZ RESULT SCREEN]', err);
      Alert.alert(
        'Failed to load result',
        err.userMessage || err.message || 'Please go back and try again.',
        [{ text: 'Go Back', onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => { loadResult(); }, [loadResult]);

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your results…</Text>
      </View>
    );
  }

  if (!result) return null;

  const pct = Math.round(result.percentage || 0);
  const isPassed = Boolean(result.isPassed);
  const grade = getGrade(pct);
  const gradientColors: [string, string] = isPassed ? ['#22C55E', '#16A34A'] : ['#EF4444', '#DC2626'];
  const questionResults: QuestionResult[] = result.questionResults || [];

  const filteredResults = questionResults.filter(qr => {
    if (filterMode === 'correct') return qr.isCorrect;
    if (filterMode === 'incorrect') return !qr.isCorrect && !!qr.selectedAnswer;
    if (filterMode === 'skipped') return !qr.selectedAnswer;
    return true;
  });

  const counts = {
    all: questionResults.length,
    correct: result.correctAnswers ?? 0,
    incorrect: result.incorrectAnswers ?? 0,
    skipped: result.unansweredQuestions ?? 0,
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />

      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]}>

        {/* ── Score Hero Card ─────────────────────────────────────────────── */}
        <LinearGradient colors={gradientColors} style={styles.heroCard}>
          {/* Back button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('QuizzesList')}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>← My Quizzes</Text>
          </TouchableOpacity>

          <Text style={styles.heroTitle}>{quizTitle}</Text>

          {/* Big score circle */}
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreCirclePct}>{pct}%</Text>
            <Text style={styles.scoreCircleGrade}>{grade}</Text>
          </View>

          <Text style={styles.passLabel}>
            {isPassed ? '🎉 Passed!' : '😔 Not Passed'}
          </Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{result.marksObtained ?? 0}</Text>
              <Text style={styles.statLabel}>Marks Got</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{result.totalMarks ?? 0}</Text>
              <Text style={styles.statLabel}>Total Marks</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{formatTime(result.timeTaken ?? 0)}</Text>
              <Text style={styles.statLabel}>Time Taken</Text>
            </View>
            {result.rank && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>#{result.rank}</Text>
                  <Text style={styles.statLabel}>Rank</Text>
                </View>
              </>
            )}
          </View>

          {/* Mini counts */}
          <View style={styles.miniBadges}>
            <View style={[styles.miniBadge, { backgroundColor: '#DCFCE7' }]}>
              <Text style={[styles.miniBadgeText, { color: '#15803D' }]}>✅ {result.correctAnswers ?? 0} Correct</Text>
            </View>
            <View style={[styles.miniBadge, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.miniBadgeText, { color: '#B91C1C' }]}>❌ {result.incorrectAnswers ?? 0} Wrong</Text>
            </View>
            <View style={[styles.miniBadge, { backgroundColor: '#F3F4F6' }]}>
              <Text style={[styles.miniBadgeText, { color: '#374151' }]}>⏭ {result.unansweredQuestions ?? 0} Skipped</Text>
            </View>
          </View>

          {/* Retake button */}
          {allowRetake && (
            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={() => navigation.replace('QuizAttempt', { quizId, quizTitle })}
            >
              <Text style={styles.retakeBtnText}>🔄 Retake Quiz</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* ── Filter Tabs (sticky) ────────────────────────────────────────── */}
        <View style={styles.filterBar}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterChip, filterMode === f.id && styles.filterChipActive]}
              onPress={() => setFilterMode(f.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, filterMode === f.id && styles.filterChipTextActive]}>
                {f.emoji} {f.label}
                {counts[f.id] > 0 ? ` (${counts[f.id]})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Question Review List ─────────────────────────────────────────── */}
        <View style={styles.reviewSection}>
          <Text style={styles.reviewTitle}>📝 Question Review</Text>
          {filteredResults.length === 0 ? (
            <View style={styles.emptyFilter}>
              <Text style={styles.emptyFilterText}>No questions in this category.</Text>
            </View>
          ) : (
            filteredResults.map((qr, i) => {
              const globalIndex = questionResults.indexOf(qr);
              return (
                <QuestionCard key={qr.questionId || i} qr={qr} index={globalIndex} />
              );
            })
          )}
        </View>

        {/* ── Bottom Spacer ──────────────────────────────────────────────── */}
        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 12, fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },

  // Hero card
  heroCard: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    alignItems: 'center',
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    marginBottom: 12,
  },
  backBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: '80%',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  scoreCirclePct: { fontSize: 34, fontWeight: '900', color: '#fff' },
  scoreCircleGrade: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.85)' },
  passLabel: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 18 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 12,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 4 },

  // Mini badges
  miniBadges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 },
  miniBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  miniBadgeText: { fontSize: 11, fontWeight: '700' },

  // Retake
  retakeBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  retakeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Filter bar (sticky)
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterChipText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
  filterChipTextActive: { color: '#fff' },

  // Review section
  reviewSection: { padding: 16 },
  reviewTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  emptyFilter: { alignItems: 'center', paddingVertical: 40 },
  emptyFilterText: { color: Colors.textMuted, fontSize: 14 },

  // Question card
  qCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  qCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  qBadge: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, flexShrink: 0,
  },
  qBadgeText: { fontSize: 11, fontWeight: '800' },
  qCardHeaderCenter: { flex: 1 },
  statusTag: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  marksTag: { fontSize: 14, fontWeight: '900', flexShrink: 0 },

  qText: { fontSize: 14, fontWeight: '600', color: Colors.text, lineHeight: 22, marginBottom: 12 },

  answersSection: { gap: 6, marginBottom: 10 },
  answerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'flex-start' },
  answerLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', minWidth: 90 },
  answerValue: { fontSize: 13, fontWeight: '700', flex: 1 },
  skippedText: { fontSize: 13, color: Colors.textMuted, fontStyle: 'italic' },

  explainToggle: { paddingVertical: 6 },
  explainToggleText: { fontSize: 12, color: '#4F46E5', fontWeight: '700' },
  explainBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  explainTitle: { fontSize: 12, fontWeight: '800', color: '#4338CA', marginBottom: 6 },
  explainText: { fontSize: 13, color: '#1E1B4B', lineHeight: 20 },
});
