import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  BackHandler,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { QuizzesStackParamList, Quiz, QuizQuestion } from '../../types';
import { quizService } from '../../services/quizService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { Colors } from '../../theme';

// ─── HTML Utility (inline) ────────────────────────────────────────────────────
const ENTITY_MAP: Record<string, string> = {
  '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>',
  '&quot;': '"', '&#39;': "'", '&apos;': "'",
  '&hellip;': '\u2026', '&mdash;': '\u2014', '&ndash;': '\u2013',
};

function stripHtmlToText(html?: string): string {
  if (!html || typeof html !== 'string') return '';
  let text = html.replace(/&[a-zA-Z]+;/g, (e) => ENTITY_MAP[e] ?? e);
  text = text.replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c, 10)));
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  text = text.replace(/<\/(p|div|li)>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]+/g, ' ');
  return text.split('\n').map((l) => l.trim()).join('\n').trim();
}

function isValidImageUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/');
}

type Props = NativeStackScreenProps<QuizzesStackParamList, 'QuizAttempt'>;

// ─── Result View ──────────────────────────────────────────────────────────────
const ResultView = ({
  result,
  quiz,
  onRetry,
  onBack,
}: {
  result: any;
  quiz?: Quiz | null;
  onRetry?: () => void;
  onBack: () => void;
}) => {
  if (!result) return null;
  const isPassed = Boolean(result.isPassed);
  const pct = Math.round(result.percentage || 0);

  return (
    <ScrollView contentContainerStyle={styles.resultScroll}>
      <LinearGradient
        colors={isPassed ? ['#22C55E', '#16A34A'] : ['#EF4444', '#DC2626']}
        style={styles.scoreBubble}>
        <Text style={styles.scorePct}>{pct}%</Text>
        <Text style={styles.scoreLabel}>{isPassed ? '🎉 Passed!' : '😔 Failed'}</Text>
      </LinearGradient>

      <View style={styles.resultGrid}>
        {[
          { label: 'Marks', val: `${result.marksObtained ?? 0}/${result.totalMarks ?? 0}`, icon: '🎯' },
          { label: 'Correct', val: result.correctAnswers ?? 0, icon: '✅' },
          { label: 'Wrong', val: result.incorrectAnswers ?? 0, icon: '❌' },
          { label: 'Skipped', val: result.unansweredQuestions ?? 0, icon: '⏭' },
        ].map(s => (
          <View key={s.label} style={styles.resultCell}>
            <Text style={styles.resultCellIcon}>{s.icon}</Text>
            <Text style={styles.resultCellVal}>{s.val}</Text>
            <Text style={styles.resultCellLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {quiz?.settings?.allowRetake && onRetry && (
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

// ─── Main Quiz Attempt Component ──────────────────────────────────────────────
const QuizAttemptContent: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const params = route?.params || {};
  const quizId = params.quizId;
  const quizTitle = params.quizTitle || 'Quiz';
  const resumeAttemptId = params.attemptId;

  const [phase, setPhase] = useState<'preview' | 'attempt' | 'result'>('preview');
  const [preview, setPreview] = useState<any>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(resumeAttemptId || null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // STEP 1 Validation: Route parameters safety guard
  if (!quizId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20, paddingHorizontal: 20 }]}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 8 }}>
          ⚠️ Quiz Selection Error
        </Text>
        <Text style={{ fontSize: 14, color: Colors.textSecondary, marginBottom: 20 }}>
          No quiz parameter was specified. Please return to the quiz list and select a quiz.
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Safe question derivations at top level
  const questions = quiz?.questions || [];
  const hasQuestions = Array.isArray(questions) && questions.length > 0;
  const currentQ: QuizQuestion | null = (hasQuestions && currentIdx >= 0 && currentIdx < questions.length)
    ? questions[currentIdx]
    : null;

  const isMatchQuestion = currentQ?.questionType === 'match';

  const matchMapping = useMemo<Record<string, string>>(() => {
    if (!currentQ || !isMatchQuestion || !currentQ._id) return {};
    const raw = answers[currentQ._id];
    if (!raw) return {};
    try { return JSON.parse(raw); } catch { return {}; }
  }, [currentQ, isMatchQuestion, answers]);

  const confirmQuit = () => {
    Alert.alert(
      'Quit Quiz?',
      'Are you sure you want to quit? Your progress will be saved.',
      [
        { text: 'Continue Quiz', style: 'cancel' },
        { text: 'Quit', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  useEffect(() => {
    if (phase !== 'attempt') return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmQuit();
      return true;
    });
    return () => handler.remove();
  }, [phase, answers]);

  const loadPreview = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      console.log(`[QUIZ ATTEMPT SCREEN] Loading preview for quizId: ${quizId}`);
      const res = await quizService.getQuizPreview(quizId);
      setPreview(res.data);
      if (res.data?.quiz?.settings?.timeLimit) {
        setTimeLeft(res.data.quiz.settings.timeLimit * 60);
      }
    } catch (err: any) {
      console.error('[QUIZ ATTEMPT SCREEN ERROR]', err);
      setErrorMsg(err.userMessage || err.message || 'Failed to load quiz information.');
    } finally {
      setIsLoading(false);
    }
  }, [quizId]);

  useEffect(() => { loadPreview(); }, [loadPreview]);

  const handleAutoSubmit = useCallback(() => {
    Alert.alert('⏰ Time Up!', 'Your time is up. Submitting answers.');
    doSubmit();
  }, []);

  const startTimer = useCallback((seconds: number) => {
    setTimeLeft(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleAutoSubmit]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const handleStart = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      console.log(`[QUIZ ATTEMPT SCREEN] Starting attempt for quizId: ${quizId}`);
      const res = await quizService.startAttempt(quizId);
      const quizObj = res.data?.quiz;
      if (!quizObj || !Array.isArray(quizObj.questions) || quizObj.questions.length === 0) {
        Alert.alert('Empty Quiz', 'This quiz does not contain any valid questions.');
        return;
      }
      setQuiz(quizObj);
      setAttemptId(res.data.attemptId);
      setPhase('attempt');
      setCurrentIdx(0);
      const timeSec = (quizObj.settings?.timeLimit || 30) * 60;
      startTimer(timeSec);
    } catch (err: any) {
      console.error('[START QUIZ ERROR]', err);
      Alert.alert('Error', err.userMessage || err.message || 'Failed to start quiz.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: string, selected: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: selected }));
    if (attemptId) {
      quizService.saveAnswer(attemptId, questionId, selected).catch(() => {});
    }
  };

  const handleMatchSelect = (questionId: string, leftIdx: number, rightIdx: string) => {
    setAnswers(prev => {
      const existing = prev[questionId];
      let mapping: Record<string, string> = {};
      try { mapping = existing ? JSON.parse(existing) : {}; } catch { /* start fresh */ }
      mapping[String(leftIdx)] = rightIdx;
      const serialized = JSON.stringify(mapping);
      if (attemptId) {
        quizService.saveAnswer(attemptId, questionId, serialized).catch(() => {});
      }
      return { ...prev, [questionId]: serialized };
    });
  };

  const doSubmit = async () => {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      console.log(`[QUIZ ATTEMPT SCREEN] Submitting attemptId: ${attemptId}`);
      const res = await quizService.submitAttempt(attemptId);
      setResult(res.data);
      setPhase('result');
    } catch (err: any) {
      console.error('[SUBMIT QUIZ ERROR]', err);
      Alert.alert('Error', err.userMessage || 'Failed to submit quiz attempt.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    const unanswered = (questions.length || 0) - Object.keys(answers).length;
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
      Alert.alert('Submit Quiz?', 'Are you sure you want to submit your quiz?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: doSubmit },
      ]);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isLoading) return <LoadingSpinner message="Loading quiz details..." />;
  if (errorMsg) return <ErrorMessage message={errorMsg} onRetry={loadPreview} />;

  // ── Result View ───────────────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ResultView
          result={result}
          quiz={quiz}
          onRetry={() => {
            setResult(null);
            setPhase('preview');
            loadPreview();
          }}
          onBack={() => navigation.goBack()}
        />
      </View>
    );
  }

  // ── Preview View ──────────────────────────────────────────────────────────────
  if (phase === 'preview' && preview) {
    const pQuiz: Quiz = preview.quiz;
    const canAttempt: boolean = preview.canAttempt;
    const completedAttempts: number = preview.completedAttempts || 0;
    const lastResult = preview.previousResults?.[0];

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4F46E5" translucent />
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          <LinearGradient colors={['#4F46E5', '#6366F1']} style={[styles.previewHeader, { paddingTop: insets.top + 16 }]}>
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
                  Last Score: {Math.round(lastResult.percentage || 0)}% • {lastResult.isPassed ? '✅ Passed' : '❌ Failed'}
                </Text>
              </View>
            )}
          </LinearGradient>

          <View style={styles.rulesCard}>
            <Text style={styles.rulesTitle}>📋 Quiz Rules</Text>
            {[
              { icon: '❓', label: 'Questions', val: pQuiz.questions?.length || '—' },
              { icon: '⏱', label: 'Time Limit', val: `${pQuiz.settings?.timeLimit || 30} minutes` },
              { icon: '🎯', label: 'Passing Score', val: `${pQuiz.settings?.passingScore || 50}%` },
              { icon: '📊', label: 'Marks/Question', val: pQuiz.settings?.marksPerQuestion || 1 },
              { icon: '➖', label: 'Negative Marking', val: (pQuiz.settings?.negativeMarking || 0) > 0 ? `${pQuiz.settings.negativeMarking} marks` : 'None' },
              { icon: '🔄', label: 'Retakes', val: pQuiz.settings?.allowRetake ? (pQuiz.settings?.maxAttempts ? `Up to ${pQuiz.settings.maxAttempts}` : 'Unlimited') : 'Not allowed' },
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
                ⛔ You have used all available attempts for this quiz.
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.startBtnWrap} onPress={handleStart} activeOpacity={0.9}>
              <LinearGradient colors={['#4F46E5', '#6366F1']} style={styles.startBtn}>
                <Text style={styles.startBtnText}>
                  {completedAttempts > 0 ? '🔄 Retake Quiz' : '▶ Start Quiz'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Attempt View ──────────────────────────────────────────────────────────────
  if (phase === 'attempt' && quiz && currentQ) {
    const isTimeCritical = timeLeft < 120;
    const answeredCount = Object.keys(answers).length;
    const progressPct = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

    // Standard options array normalized safely
    const rawOptions = currentQ.options || [];
    const normalizedOptions = rawOptions.map((opt: any, i: number) => {
      if (typeof opt === 'string') return { id: opt, text: stripHtmlToText(opt) };
      if (opt && typeof opt === 'object') return { id: String(opt.id || opt.text || i + 1), text: stripHtmlToText(opt.text || opt.value || '') };
      return { id: String(i + 1), text: String(opt || '') };
    });

    const matchPairs = currentQ.matchPairs || [];

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        {/* Attempt Header Bar */}
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

        {/* Progress Bar */}
        <View style={styles.attemptProgress}>
          <View style={[styles.attemptProgressFill, { width: `${progressPct}%` as any }]} />
        </View>

        <ScrollView contentContainerStyle={styles.questionScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionNum}>Question {currentIdx + 1}</Text>
            {isMatchQuestion && (
              <View style={styles.matchBadge}>
                <Text style={styles.matchBadgeText}>↔ Match</Text>
              </View>
            )}
          </View>

          {/* Question Text */}
          <Text style={styles.questionText}>
            {stripHtmlToText(currentQ.questionText || '')}
          </Text>

          {/* Question Image (Valid URL Check) */}
          {isValidImageUrl(currentQ.questionImage) && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: currentQ.questionImage }}
                style={styles.qImage}
                resizeMode="contain"
              />
            </View>
          )}

          {/* ── Match pairs renderer ────────────────────────────────────────── */}
          {isMatchQuestion ? (
            <View style={styles.matchContainer}>
              <View style={styles.matchHeaderRow}>
                <View style={[styles.matchHeaderCell, { backgroundColor: '#EEF2FF' }]}>
                  <Text style={[styles.matchHeaderText, { color: '#4F46E5' }]}>Column A</Text>
                </View>
                <View style={[styles.matchHeaderCell, { backgroundColor: '#F0FDF4' }]}>
                  <Text style={[styles.matchHeaderText, { color: '#16A34A' }]}>Column B (Select match ↓)</Text>
                </View>
              </View>

              {matchPairs.map((pair, leftIdx) => {
                const selectedRightIdx = matchMapping[String(leftIdx)] ?? '';
                const isAnswered = selectedRightIdx !== '';

                return (
                  <View key={pair.id || `pair_${leftIdx}`} style={styles.matchPairRow}>
                    <View style={[styles.matchColA, isAnswered && styles.matchColAAnswered]}>
                      <Text style={styles.matchColANum}>{leftIdx + 1}.</Text>
                      <Text style={styles.matchColAText}>{stripHtmlToText(pair.left || '')}</Text>
                    </View>

                    <View style={[styles.matchColB, isAnswered && styles.matchColBAnswered]}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.matchPickerScroll}>
                        <TouchableOpacity
                          style={[styles.matchChip, selectedRightIdx === '' && styles.matchChipBlank]}
                          onPress={() => handleMatchSelect(currentQ._id!, leftIdx, '')}>
                          <Text style={[styles.matchChipText, selectedRightIdx === '' && styles.matchChipTextBlank]}>
                            — Select —
                          </Text>
                        </TouchableOpacity>

                        {matchPairs.map((rightPair, rightIdx) => {
                          const isSelected = selectedRightIdx === String(rightIdx);
                          return (
                            <TouchableOpacity
                              key={rightPair.id || `right_${rightIdx}`}
                              style={[styles.matchChip, isSelected && styles.matchChipSelected]}
                              onPress={() => handleMatchSelect(currentQ._id!, leftIdx, String(rightIdx))}>
                              <Text style={[styles.matchChipText, isSelected && styles.matchChipTextSelected]}>
                                {stripHtmlToText(rightPair.right || '')}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            /* ── MCQ options renderer ────────────────────────────────────────── */
            <View style={styles.optionsContainer}>
              {normalizedOptions.map((optObj, idx) => {
                const selected = answers[currentQ._id!] === optObj.id || answers[currentQ._id!] === optObj.text;
                const label = ['A', 'B', 'C', 'D', 'E', 'F'][idx] || String(idx + 1);

                return (
                  <TouchableOpacity
                    key={optObj.id || `opt_${idx}`}
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => handleSelectAnswer(currentQ._id!, optObj.text)}
                    activeOpacity={0.75}>
                    <View style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                      <Text style={[styles.optionLabelText, selected && { color: '#fff' }]}>{label}</Text>
                    </View>
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]} numberOfLines={4}>
                      {optObj.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Prev / Next Navigation Row */}
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

          {/* Question Dots Palette */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.palette}>
            {questions.map((qq, i) => {
              const qId = qq._id || `q_${i}`;
              return (
                <TouchableOpacity
                  key={qId}
                  style={[
                    styles.dot,
                    i === currentIdx && styles.dotActive,
                    answers[qId] && styles.dotAnswered,
                  ]}
                  onPress={() => setCurrentIdx(i)}>
                  <Text style={styles.dotText}>{i + 1}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={{ height: insets.bottom + 24 }} />
        </ScrollView>
      </View>
    );
  }

  return <LoadingSpinner fullScreen message="Preparing quiz..." />;
};

// ─── Exported Screen wrapped inside ErrorBoundary ─────────────────────────────
export const QuizAttemptScreen: React.FC<Props> = (props) => {
  return (
    <ErrorBoundary
      fallbackTitle="Quiz Screen Error"
      onGoBack={() => props.navigation.goBack()}
    >
      <QuizAttemptContent {...props} />
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  resultScroll: { padding: 20, alignItems: 'center' },
  scoreBubble: {
    width: 140, height: 140, borderRadius: 70,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
  },
  scorePct: { fontSize: 36, fontWeight: '900', color: '#fff' },
  scoreLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  resultGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24, width: '100%' },
  resultCell: { flex: 1, minWidth: '45%', backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  resultCellIcon: { fontSize: 20, marginBottom: 4 },
  resultCellVal: { fontSize: 18, fontWeight: '800', color: Colors.text },
  resultCellLabel: { fontSize: 12, color: Colors.textMuted },
  retryBtn: { width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  retryGrad: { paddingVertical: 14, alignItems: 'center' },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  backBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  backBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 14 },
  previewHeader: { padding: 20, paddingBottom: 28 },
  previewBack: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  previewBackText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  previewTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  previewCourse: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 10 },
  lastResultChip: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  lastResultText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  rulesCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  rulesTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  ruleIcon: { width: 26, fontSize: 15 },
  ruleLabel: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  ruleVal: { fontSize: 13, fontWeight: '700', color: Colors.text },
  noAttemptBanner: { margin: 16, padding: 14, backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' },
  noAttemptText: { color: '#DC2626', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  startBtnWrap: { marginHorizontal: 16, borderRadius: 14, overflow: 'hidden' },
  startBtn: { paddingVertical: 16, alignItems: 'center' },
  startBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  attemptBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  quitBtn: { padding: 4 },
  quitText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  timerBox: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  timerText: { fontSize: 14, fontWeight: '700', color: '#4F46E5' },
  timerCritical: { color: '#EF4444' },
  qCount: { fontSize: 14, fontWeight: '700', color: Colors.text },
  attemptProgress: { height: 4, backgroundColor: '#E5E7EB', width: '100%' },
  attemptProgressFill: { height: '100%', backgroundColor: '#4F46E5' },
  questionScroll: { padding: 16 },
  questionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  questionNum: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  matchBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  matchBadgeText: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },
  questionText: { fontSize: 16, fontWeight: '700', color: Colors.text, lineHeight: 24, marginBottom: 16 },
  imageContainer: { width: '100%', height: 180, marginBottom: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F9FAFB' },
  qImage: { width: '100%', height: '100%' },
  optionsContainer: { gap: 10, marginBottom: 20 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff', gap: 12 },
  optionSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  optionLabel: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  optionLabelSelected: { backgroundColor: '#4F46E5' },
  optionLabelText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  optionText: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 20 },
  optionTextSelected: { color: '#4F46E5', fontWeight: '700' },
  matchContainer: { gap: 10, marginBottom: 20 },
  matchHeaderRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  matchHeaderCell: { flex: 1, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, alignItems: 'center' },
  matchHeaderText: { fontSize: 12, fontWeight: '700' },
  matchPairRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  matchColA: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', gap: 6 },
  matchColAAnswered: { borderColor: '#818CF8', backgroundColor: '#EEF2FF' },
  matchColANum: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  matchColAText: { fontSize: 13, color: Colors.text, flex: 1 },
  matchColB: { flex: 1 },
  matchColBAnswered: { opacity: 1 },
  matchPickerScroll: { gap: 6 },
  matchChip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: '#F3F4F6', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  matchChipBlank: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB' },
  matchChipSelected: { backgroundColor: '#10B981' },
  matchChipText: { fontSize: 12, color: Colors.textSecondary },
  matchChipTextBlank: { color: '#9CA3AF' },
  matchChipTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginVertical: 16 },
  navBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontSize: 14, fontWeight: '700', color: Colors.text },
  submitBtn: { backgroundColor: '#10B981' },
  palette: { flexDirection: 'row', marginVertical: 10 },
  dot: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  dotActive: { backgroundColor: '#4F46E5' },
  dotAnswered: { borderHeight: 2, borderColor: '#10B981', backgroundColor: '#D1FAE5' } as any,
  dotText: { fontSize: 12, fontWeight: '700', color: Colors.text },
});
