import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  BackHandler,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { QuizzesStackParamList, Quiz, QuizQuestion, QuizResultItem } from '../../types';
import { quizService } from '../../services/quizService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Colors, Spacing } from '../../theme';

type Props = NativeStackScreenProps<QuizzesStackParamList, 'QuizAttempt'>;

// ─── Result view ──────────────────────────────────────────────────────────────
const ResultView = ({
  result,
  quiz,
  onRetry,
  onBack,
}: {
  result: any;
  quiz: Quiz;
  onRetry?: () => void;
  onBack: () => void;
}) => {
  const isPassed = result.isPassed;
  const pct = Math.round(result.percentage);

  return (
    <ScrollView contentContainerStyle={styles.resultScroll}>
      {/* Score circle */}
      <LinearGradient
        colors={isPassed ? ['#22C55E', '#16A34A'] : ['#EF4444', '#DC2626']}
        style={styles.scoreBubble}>
        <Text style={styles.scorePct}>{pct}%</Text>
        <Text style={styles.scoreLabel}>{isPassed ? '🎉 Passed!' : '😔 Failed'}</Text>
      </LinearGradient>

      {/* Stats grid */}
      <View style={styles.resultGrid}>
        {[
          { label: 'Marks', val: `${result.marksObtained}/${result.totalMarks}`, icon: '🎯' },
          { label: 'Correct', val: result.correctAnswers, icon: '✅' },
          { label: 'Wrong', val: result.incorrectAnswers, icon: '❌' },
          { label: 'Skipped', val: result.unansweredQuestions, icon: '⏭' },
        ].map(s => (
          <View key={s.label} style={styles.resultCell}>
            <Text style={styles.resultCellIcon}>{s.icon}</Text>
            <Text style={styles.resultCellVal}>{s.val}</Text>
            <Text style={styles.resultCellLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {quiz.settings.allowRetake && onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <LinearGradient colors={['#4F46E5', '#6366F1']} style={styles.retryGrad}>
            <Text style={styles.retryText}>🔄 Retry Quiz</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backBtnText}>← Back to Quizzes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export const QuizAttemptScreen: React.FC<Props> = ({ route, navigation }) => {
  const { quizId, quizTitle, attemptId: resumeAttemptId } = route.params;
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<'preview' | 'attempt' | 'result'>('preview');
  const [preview, setPreview] = useState<any>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(resumeAttemptId || null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Prevent back during attempt
  useEffect(() => {
    if (phase !== 'attempt') return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmQuit();
      return true;
    });
    return () => handler.remove();
  }, [phase, answers]);

  useEffect(() => { loadPreview(); }, []);

  const loadPreview = async () => {
    try {
      const res = await quizService.getQuizPreview(quizId);
      setPreview(res.data);
      setTimeLeft(res.data.quiz.settings.timeLimit * 60);
    } catch (err: any) {
      Alert.alert('Error', err.userMessage || 'Failed to load quiz.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const startTimer = useCallback((seconds: number) => {
    setTimeLeft(seconds);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { timerRef.current && clearInterval(timerRef.current); }, []);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const res = await quizService.startAttempt(quizId);
      setQuiz(res.data.quiz);
      setAttemptId(res.data.attemptId);
      setPhase('attempt');
      startTimer(res.data.quiz.settings.timeLimit * 60);
    } catch (err: any) {
      Alert.alert('Error', err.userMessage || 'Failed to start quiz.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAnswer = async (questionId: string, selected: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: selected }));
    // Auto-save answer to backend
    if (attemptId) {
      quizService.saveAnswer(attemptId, questionId, selected).catch(() => {});
    }
  };

  const handleSubmit = () => {
    const unanswered = (quiz?.questions.length || 0) - Object.keys(answers).length;
    if (unanswered > 0) {
      Alert.alert(
        'Submit Quiz?',
        `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Submit anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', style: 'destructive', onPress: doSubmit },
        ]
      );
    } else {
      Alert.alert('Submit Quiz?', 'Are you sure you want to submit?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: doSubmit },
      ]);
    }
  };

  const handleAutoSubmit = () => {
    Alert.alert('⏰ Time Up!', 'Your answers have been auto-submitted.');
    doSubmit();
  };

  const doSubmit = async () => {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    timerRef.current && clearInterval(timerRef.current);
    try {
      const res = await quizService.submitAttempt(attemptId);
      setResult(res.data);
      setPhase('result');
    } catch (err: any) {
      Alert.alert('Error', err.userMessage || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmQuit = () => {
    Alert.alert('Quit Quiz?', 'Your progress will be saved. You can resume later.', [
      { text: 'Continue Quiz', style: 'cancel' },
      { text: 'Quit', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  const handleRetry = () => {
    setPhase('preview');
    setAnswers({});
    setCurrentIdx(0);
    setResult(null);
    loadPreview();
  };

  // Format seconds → MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
  const isTimeCritical = timeLeft <= 60;

  if (isLoading) return <LoadingSpinner fullScreen message="Loading quiz..." />;

  // ── Result view ──────────────────────────────────────────────────────────────
  if (phase === 'result' && result && quiz) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <TouchableOpacity style={styles.navBack} onPress={() => navigation.goBack()}>
          <Text style={styles.navBackText}>✕</Text>
        </TouchableOpacity>
        <ResultView
          result={result}
          quiz={quiz}
          onRetry={quiz.settings.allowRetake ? handleRetry : undefined}
          onBack={() => navigation.goBack()}
        />
      </View>
    );
  }

  // ── Preview / rules view ──────────────────────────────────────────────────────
  if (phase === 'preview' && preview) {
    const { quiz: pQuiz, canAttempt, completedAttempts, previousResults } = preview;
    const lastResult = previousResults?.[0];

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#4F46E5" translucent />
        <ScrollView showsVerticalScrollIndicator={false}>
          <LinearGradient colors={['#4F46E5', '#6366F1']} style={styles.previewHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.previewBack}>
              <Text style={styles.previewBackText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.previewTitle}>{pQuiz.title}</Text>
            {pQuiz.courseName && (
              <Text style={styles.previewCourse}>📚 {pQuiz.courseName}</Text>
            )}
            {lastResult && (
              <View style={styles.lastResultChip}>
                <Text style={styles.lastResultText}>
                  Last Score: {Math.round(lastResult.percentage)}% • {lastResult.isPassed ? '✅ Passed' : '❌ Failed'}
                </Text>
              </View>
            )}
          </LinearGradient>

          <View style={styles.rulesCard}>
            <Text style={styles.rulesTitle}>📋 Quiz Rules</Text>
            {[
              { icon: '❓', label: 'Questions', val: pQuiz.questions?.length || '—' },
              { icon: '⏱', label: 'Time Limit', val: `${pQuiz.settings.timeLimit} minutes` },
              { icon: '🎯', label: 'Passing Score', val: `${pQuiz.settings.passingScore}%` },
              { icon: '📊', label: 'Marks/Question', val: pQuiz.settings.marksPerQuestion },
              { icon: '➖', label: 'Negative Marking', val: pQuiz.settings.negativeMarking > 0 ? `${pQuiz.settings.negativeMarking} marks` : 'None' },
              { icon: '🔄', label: 'Retakes', val: pQuiz.settings.allowRetake ? (pQuiz.settings.maxAttempts ? `Up to ${pQuiz.settings.maxAttempts}` : 'Unlimited') : 'Not allowed' },
              { icon: '🔀', label: 'Shuffle', val: pQuiz.settings.shuffleQuestions ? 'Questions shuffled' : 'Fixed order' },
            ].map(r => (
              <View key={r.label} style={styles.ruleRow}>
                <Text style={styles.ruleIcon}>{r.icon}</Text>
                <Text style={styles.ruleLabel}>{r.label}</Text>
                <Text style={styles.ruleVal}>{String(r.val)}</Text>
              </View>
            ))}
          </View>

          {!canAttempt ? (
            <View style={styles.noAttemptBanner}>
              <Text style={styles.noAttemptText}>
                ⛔ You have used all your attempts for this quiz.
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.startBtnWrap}
              onPress={handleStart}
              activeOpacity={0.9}>
              <LinearGradient colors={['#4F46E5', '#6366F1']} style={styles.startBtn}>
                <Text style={styles.startBtnText}>
                  {completedAttempts > 0 ? '🔄 Retake Quiz' : '▶ Start Quiz'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          <View style={{ height: insets.bottom + 32 }} />
        </ScrollView>
      </View>
    );
  }

  // ── Attempt view ──────────────────────────────────────────────────────────────
  if (phase === 'attempt' && quiz) {
    const questions = quiz.questions;
    const q: QuizQuestion = questions[currentIdx];
    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / questions.length) * 100;

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        {/* Top bar */}
        <View style={styles.attemptBar}>
          <TouchableOpacity onPress={confirmQuit} style={styles.quitBtn}>
            <Text style={styles.quitText}>✕ Quit</Text>
          </TouchableOpacity>
          <View style={styles.timerBox}>
            <Text style={[styles.timerText, isTimeCritical && styles.timerCritical]}>
              ⏱ {formatTime(timeLeft)}
            </Text>
          </View>
          <Text style={styles.qCount}>{currentIdx + 1}/{questions.length}</Text>
        </View>

        {/* Progress */}
        <View style={styles.attemptProgress}>
          <View style={[styles.attemptProgressFill, { width: `${progress}%` as any }]} />
        </View>

        {/* Question + options */}
        <ScrollView contentContainerStyle={styles.questionScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.questionNum}>Question {currentIdx + 1}</Text>
          <Text style={styles.questionText}>{q.questionText}</Text>

          <View style={styles.optionsContainer}>
            {q.options.map((opt, idx) => {
              const selected = answers[q._id] === opt;
              const label = ['A', 'B', 'C', 'D'][idx] || String(idx + 1);
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => handleSelectAnswer(q._id, opt)}
                  activeOpacity={0.75}>
                  <View style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                    <Text style={[styles.optionLabelText, selected && { color: '#fff' }]}>{label}</Text>
                  </View>
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]} numberOfLines={3}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Navigation */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.navBtn, currentIdx === 0 && styles.navBtnDisabled]}
              onPress={() => currentIdx > 0 && setCurrentIdx(i => i - 1)}
              disabled={currentIdx === 0}>
              <Text style={styles.navBtnText}>← Prev</Text>
            </TouchableOpacity>

            {currentIdx < questions.length - 1 ? (
              <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentIdx(i => i + 1)}>
                <Text style={styles.navBtnText}>Next →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.navBtn, styles.submitBtn]}
                onPress={handleSubmit}
                disabled={submitting}>
                <Text style={[styles.navBtnText, { color: '#fff' }]}>
                  {submitting ? 'Submitting…' : '✅ Submit'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Dot palette */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.palette}>
            {questions.map((qq, i) => (
              <TouchableOpacity
                key={qq._id}
                style={[
                  styles.dot,
                  i === currentIdx && styles.dotActive,
                  answers[qq._id] && styles.dotAnswered,
                ]}
                onPress={() => setCurrentIdx(i)}>
                <Text style={styles.dotText}>{i + 1}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={{ height: insets.bottom + 24 }} />
        </ScrollView>
      </View>
    );
  }

  return <LoadingSpinner fullScreen />;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  navBack: { padding: 16 },
  navBackText: { fontSize: 22, color: Colors.text },
  // ── Preview ──────────────────────────────────────────────────────────────────
  previewHeader: { padding: 24, paddingBottom: 32, marginBottom: -10 },
  previewBack: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  previewBackText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  previewTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 6 },
  previewCourse: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 12 },
  lastResultChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  lastResultText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  rulesCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  rulesTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 14 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  ruleIcon: { width: 28, fontSize: 16 },
  ruleLabel: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  ruleVal: { fontSize: 13, fontWeight: '700', color: Colors.text },
  noAttemptBanner: {
    margin: 16, padding: 16,
    backgroundColor: '#FEF2F2', borderRadius: 12,
    borderWidth: 1, borderColor: '#FECACA',
  },
  noAttemptText: { color: '#DC2626', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  startBtnWrap: { marginHorizontal: 16, borderRadius: 14, overflow: 'hidden' },
  startBtn: { paddingVertical: 16, alignItems: 'center' },
  startBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  // ── Attempt ──────────────────────────────────────────────────────────────────
  attemptBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  quitBtn: { padding: 4 },
  quitText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },
  timerBox: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20,
  },
  timerText: { fontSize: 14, fontWeight: '700', color: Colors.text },
  timerCritical: { color: '#EF4444' },
  qCount: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  attemptProgress: {
    height: 4, backgroundColor: '#E5E7EB',
    marginHorizontal: 0,
  },
  attemptProgressFill: {
    height: '100%', backgroundColor: '#4F46E5',
  },
  questionScroll: { padding: 20 },
  questionNum: { fontSize: 12, color: '#4F46E5', fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  questionText: { fontSize: 17, fontWeight: '700', color: Colors.text, lineHeight: 25, marginBottom: 22 },
  optionsContainer: { gap: 10, marginBottom: 24 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    backgroundColor: '#FAFAFA',
  },
  optionSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  optionLabel: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  optionLabelSelected: { backgroundColor: '#4F46E5' },
  optionLabelText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  optionText: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 20 },
  optionTextSelected: { color: '#4F46E5', fontWeight: '600' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  navBtn: {
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12, backgroundColor: '#F3F4F6',
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontSize: 14, fontWeight: '700', color: Colors.text },
  submitBtn: { backgroundColor: '#4F46E5' },
  palette: { marginBottom: 16 },
  dot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
  },
  dotActive: { borderWidth: 2, borderColor: '#4F46E5' },
  dotAnswered: { backgroundColor: '#4F46E5' },
  dotText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  // ── Result ───────────────────────────────────────────────────────────────────
  resultScroll: { alignItems: 'center', padding: 24 },
  scoreBubble: {
    width: 160, height: 160, borderRadius: 80,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 14, elevation: 8,
  },
  scorePct: { fontSize: 42, fontWeight: '800', color: '#fff' },
  scoreLabel: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  resultGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    width: '100%', gap: 10, marginBottom: 24,
  },
  resultCell: {
    flex: 1, minWidth: '44%',
    backgroundColor: '#F9FAFB', borderRadius: 14,
    alignItems: 'center', paddingVertical: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  resultCellIcon: { fontSize: 24, marginBottom: 4 },
  resultCellVal: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  resultCellLabel: { fontSize: 12, color: Colors.textSecondary },
  retryBtn: { width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  retryGrad: { paddingVertical: 15, alignItems: 'center' },
  retryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  backBtn: { padding: 12 },
  backBtnText: { fontSize: 14, color: '#4F46E5', fontWeight: '600' },
});
