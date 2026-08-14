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
  TextInput,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeStackParamList, CourseSubject, Course, Note, Quiz } from '../../types';
import { courseService } from '../../services/courseService';
import { enrollmentService } from '../../services/enrollmentService';
import { noteService } from '../../services/noteService';
import { quizService } from '../../services/quizService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Colors, Spacing } from '../../theme';
import { SecurePdfViewer } from '../notes/SecurePdfViewer';

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

// ─── Helper: file type badge config ──────────────────────────────────────────
const FILE_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  pdf: { icon: '📄', color: '#EF4444', bg: '#FEF2F2', label: 'PDF' },
  txt: { icon: '📝', color: '#6366F1', bg: '#EEF2FF', label: 'TXT' },
  doc: { icon: '📚', color: '#2563EB', bg: '#EFF6FF', label: 'DOC' },
  file: { icon: '📁', color: '#4F46E5', bg: '#EEF2FF', label: 'FILE' },
  html: { icon: '🌐', color: '#059669', bg: '#ECFDF5', label: 'HTML' },
};


// ─── Subject Notes Tab Component ──────────────────────────────────────────────
const SubjectNotesView = ({
  courseId,
  subjectId,
}: {
  courseId: string;
  subjectId: string;
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'txt' | 'doc'>('all');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');

  const fetchNotes = useCallback(async () => {
    try {
      setError(null);
      console.log(`[MOBILE NOTE FETCH] courseId: ${courseId}, subjectId: ${subjectId}`);
      const res = await noteService.getSubjectNotes(courseId, subjectId, {
        search: search || undefined,
        fileType: filterType !== 'all' ? filterType : undefined,
        sort: sortOption,
      });
      setNotes(res.notes || []);
    } catch (err: any) {
      console.error('[MOBILE NOTE FETCH ERROR]', err);
      setError(err.userMessage || 'Failed to load notes for this subject.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [courseId, subjectId, search, filterType, sortOption]);

  useEffect(() => {
    setIsLoading(true);
    fetchNotes();
  }, [fetchNotes]);

  // Viewer state
  const [viewerVisible, setViewerVisible] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  const handleView = (note: Note) => {
    setActiveNote(note);
    setViewerVisible(true);
  };

  const handlePrint = (note: Note) => {
    setActiveNote(note);
    setViewerVisible(true);
  };

  if (isLoading) return <LoadingSpinner message="Loading subject notes..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchNotes} />;

  return (
    <View style={styles.notesContainer}>
      {/* Secure PDF Viewer */}
      {activeNote && (
        <SecurePdfViewer
          visible={viewerVisible}
          noteId={activeNote._id}
          noteTitle={activeNote.title}
          fileType={activeNote.fileType}
          onClose={() => { setViewerVisible(false); setActiveNote(null); }}
        />
      )}
      {/* Search & Sort Controls */}
      <View style={styles.notesControls}>
        <View style={styles.notesSearchBox}>
          <Text style={styles.searchIconText}>🔍</Text>
          <TextInput
            style={styles.notesSearchInput}
            placeholder="Search notes in subject..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: '#9CA3AF', fontSize: 14 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sort Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort:</Text>
          {(['newest', 'oldest', 'alphabetical'] as const).map(so => (
            <TouchableOpacity
              key={so}
              style={[styles.sortChip, sortOption === so && styles.sortChipActive]}
              onPress={() => setSortOption(so)}>
              <Text style={[styles.sortChipText, sortOption === so && styles.sortChipTextActive]}>
                {so === 'newest' ? '⏱ Newest' : so === 'oldest' ? '⌛ Oldest' : '🔤 A-Z'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filter chips */}
        <View style={styles.filterChipRow}>
          {(['all', 'pdf', 'txt', 'doc'] as const).map(ft => (
            <TouchableOpacity
              key={ft}
              style={[styles.typeFilterChip, filterType === ft && styles.typeFilterChipActive]}
              onPress={() => setFilterType(ft)}>
              <Text style={[styles.typeFilterChipText, filterType === ft && styles.typeFilterChipTextActive]}>
                {ft.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notes List */}
      <FlatList
        data={notes}
        keyExtractor={item => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotes(); }} tintColor="#4F46E5" />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        renderItem={({ item }) => {
          const fc = FILE_CONFIG[item.fileType] || FILE_CONFIG.file;
          const date = new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          return (
            <View style={styles.noteCard}>
              <View style={[styles.noteFileIcon, { backgroundColor: fc.bg }]}>
                <Text style={{ fontSize: 22 }}>{fc.icon}</Text>
                <Text style={[styles.noteFileType, { color: fc.color }]}>{fc.label}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.noteTitle} numberOfLines={2}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.noteDesc} numberOfLines={2}>{item.description}</Text>
                ) : null}
                {item.chapterName ? (
                  <Text style={styles.chapterBadge}>📌 Chapter: {item.chapterName}</Text>
                ) : null}
                <Text style={styles.noteDate}>Uploaded on {date}</Text>
              </View>

              <View style={styles.noteActions}>
                <TouchableOpacity style={styles.viewNoteBtn} onPress={() => handleView(item)} activeOpacity={0.8}>
                  <Text style={{ fontSize: 13 }}>👁</Text>
                  <Text style={styles.viewNoteBtnText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.printNoteBtn} onPress={() => handlePrint(item)} activeOpacity={0.8}>
                  <Text style={{ fontSize: 13 }}>🖨</Text>
                  <Text style={styles.printNoteBtnText}>Print</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📂</Text>
            <Text style={styles.emptyTitle}>No Notes Available</Text>
            <Text style={styles.emptySub}>
              {search
                ? `No notes match "${search}". Try clearing your search.`
                : 'Notes uploaded by your teachers for this subject will appear here.'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

// ─── Subject Quizzes Tab Component ───────────────────────────────────────────
const SubjectQuizzesView = ({
  courseId,
  subjectId,
  subjectName,
  navigation,
}: {
  courseId: string;
  subjectId: string;
  subjectName: string;
  navigation: any;
}) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuizzes = useCallback(async () => {
    try {
      setError(null);
      const res = await quizService.getAvailableQuizzes();
      const allQuizzes = res.data || [];
      const subjectQuizzes = allQuizzes.filter((q) => {
        const matchesSubjectId = q.subjectId && q.subjectId.toString() === subjectId.toString();
        const matchesSubjectName = q.subjectName && q.subjectName.toLowerCase().trim() === subjectName.toLowerCase().trim();
        return matchesSubjectId || matchesSubjectName;
      });
      setQuizzes(subjectQuizzes);
    } catch (err: any) {
      setError(err.userMessage || 'Failed to load quizzes for this subject.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [courseId, subjectId, subjectName]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  // Extract unique categories
  const categoryList = Array.from(
    new Set(quizzes.map((q) => q.categoryName).filter((c): c is string => Boolean(c && c.trim())))
  );

  // Auto-select the first real category
  useEffect(() => {
    if (categoryList.length > 0) {
      if (!selectedCategory || !categoryList.some(c => c.toLowerCase() === selectedCategory.toLowerCase())) {
        setSelectedCategory(categoryList[0]);
      }
    } else {
      setSelectedCategory('');
    }
  }, [categoryList, selectedCategory]);

  const filteredQuizzes = quizzes.filter((q) => {
    if (!selectedCategory) return true;
    return q.categoryName?.toLowerCase().trim() === selectedCategory.toLowerCase().trim();
  });

  const handleQuizPress = (quiz: Quiz) => {
    if (!quiz || !quiz._id) return;
    if (quiz.status === 'in-progress' && quiz.inProgressAttemptId) {
      navigation.navigate('QuizAttempt', {
        quizId: quiz._id,
        quizTitle: quiz.title || 'Quiz',
        attemptId: quiz.inProgressAttemptId,
      });
    } else if (quiz.status === 'completed' && quiz.allAttempts && quiz.allAttempts.length > 0) {
      navigation.navigate('QuizResult', {
        attemptId: quiz.allAttempts[0].attemptId,
        quizId: quiz._id,
        quizTitle: quiz.title || 'Quiz',
        allowRetake: quiz.settings?.allowRetake ?? false,
      });
    } else {
      navigation.navigate('QuizAttempt', {
        quizId: quiz._id,
        quizTitle: quiz.title || 'Quiz',
      });
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading quizzes..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchQuizzes} />;

  return (
    <View style={styles.notesContainer}>
      {categoryList.length > 0 ? (
        <View style={styles.notesControls}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {categoryList.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.typeFilterChip, selectedCategory.toLowerCase() === cat.toLowerCase() && styles.typeFilterChipActive]}
                onPress={() => setSelectedCategory(cat)}>
                <Text style={[styles.typeFilterChipText, selectedCategory.toLowerCase() === cat.toLowerCase() && styles.typeFilterChipTextActive]}>
                  {cat.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 13, color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center' }}>
            No quiz categories available for this subject.
          </Text>
        </View>
      )}

      <FlatList
        data={filteredQuizzes}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchQuizzes(); }} tintColor="#4F46E5" />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        renderItem={({ item }) => {
          const statusKey = item.status || 'not-attempted';
          const isDone = statusKey === 'completed';
          const inProg = statusKey === 'in-progress';
          return (
            <TouchableOpacity style={styles.card} onPress={() => handleQuizPress(item)} activeOpacity={0.85}>
              <View style={styles.cardInfo}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={[styles.completeBadge, {
                    color: isDone ? '#22C55E' : inProg ? '#D97706' : '#4F46E5',
                    backgroundColor: isDone ? '#DCFCE7' : inProg ? '#FEF3C7' : '#EEF2FF',
                  }]}>
                    {isDone ? '✓ Completed' : inProg ? '⏱ In Progress' : 'Start'}
                  </Text>
                </View>
                {item.categoryName ? (
                  <Text style={[styles.chapterBadge, { marginBottom: 6 }]}>🏷️ {item.categoryName}</Text>
                ) : null}
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <Text style={styles.progressLabel}>⏱ {item.settings?.timeLimit || 30} mins</Text>
                  <Text style={styles.progressLabel}>❓ {item.totalQuestions ?? item.questions?.length ?? 0} Qs</Text>
                  {item.settings?.passingPercentage ? (
                    <Text style={styles.progressLabel}>🎯 {item.settings.passingPercentage}% Pass</Text>
                  ) : null}
                </View>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📝</Text>
            <Text style={styles.emptyTitle}>No Quizzes Available</Text>
            <Text style={styles.emptySub}>
              Quizzes created for {subjectName} will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export const SubjectSelectionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { courseId, courseTitle } = route.params;
  const insets = useSafeAreaInsets();

  const [course, setCourse] = useState<Course | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [selectedSubject, setSelectedSubject] = useState<CourseSubject | null>(null);
  const [activeTab, setActiveTab] = useState<'videos' | 'notes' | 'quizzes'>('videos');
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

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleLessonPress = (lessonId: string, lessonTitle: string, subjectId: string) => {
    navigation.navigate('VideoPlayer', {
      courseId,
      lessonId,
      lessonTitle,
      subjectId,
    });
  };

  if (isLoading) return <LoadingSpinner fullScreen message="Loading subjects..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  const subjects = course?.subjects || [];
  const totalLessons = subjects.reduce((acc, s) => acc + countSubjectLessons(s), 0);
  const completedCount = completedIds.size;
  const overallPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // ── Subject Detail Mode ───────────────────────────────────────────────────────
  if (selectedSubject) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4F46E5" translucent />
        {/* Header */}
        <LinearGradient
          colors={['#4F46E5', '#6366F1']}
          style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => setSelectedSubject(null)} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 28 }}>{selectedSubject.icon || '📚'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>{selectedSubject.name}</Text>
              <Text style={styles.headerSub}>{courseTitle || 'Subject Details'}</Text>
            </View>
          </View>

          {/* Sub-Tabs: Videos | Notes | Quizzes */}
          <View style={styles.subTabsRow}>
            <TouchableOpacity
              style={[styles.subTab, activeTab === 'videos' && styles.subTabActive]}
              onPress={() => setActiveTab('videos')}>
              <Text style={[styles.subTabText, activeTab === 'videos' && styles.subTabTextActive]}>
                🎬 Videos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.subTab, activeTab === 'notes' && styles.subTabActive]}
              onPress={() => setActiveTab('notes')}>
              <Text style={[styles.subTabText, activeTab === 'notes' && styles.subTabTextActive]}>
                📄 Notes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.subTab, activeTab === 'quizzes' && styles.subTabActive]}
              onPress={() => setActiveTab('quizzes')}>
              <Text style={[styles.subTabText, activeTab === 'quizzes' && styles.subTabTextActive]}>
                📝 Quizzes
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {activeTab === 'notes' ? (
          <SubjectNotesView courseId={courseId} subjectId={selectedSubject._id} />
        ) : activeTab === 'quizzes' ? (
          <SubjectQuizzesView
            courseId={courseId}
            subjectId={selectedSubject._id}
            subjectName={selectedSubject.name}
            navigation={navigation}
          />
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
            {(selectedSubject.sections || []).length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={{ fontSize: 40, marginBottom: 8 }}>🎬</Text>
                <Text style={styles.emptyTitle}>No Videos Yet</Text>
                <Text style={styles.emptySub}>Video lessons for this subject will appear here.</Text>
              </View>
            ) : (
              (selectedSubject.sections || []).map((sec, secIdx) => (
                <View key={sec._id || secIdx} style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Section {secIdx + 1}: {sec.title}</Text>
                  {(sec.subsections || []).map((sub, subIdx) => (
                    <View key={sub._id || subIdx} style={{ marginTop: 8 }}>
                      <Text style={styles.subSectionTitle}>{sub.title}</Text>
                      {(sub.content || []).filter(c => c.type === 'video').map((item) => {
                        const isDone = completedIds.has(item._id);
                        return (
                          <TouchableOpacity
                            key={item._id}
                            style={styles.lessonRow}
                            onPress={() => handleLessonPress(item._id, item.title, selectedSubject._id)}>
                            <Text style={{ fontSize: 18 }}>{isDone ? '✅' : '▶️'}</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.lessonTitle}>{item.title}</Text>
                              {item.duration ? <Text style={styles.lessonDuration}>{item.duration}</Text> : null}
                            </View>
                            <Text style={{ color: '#4F46E5', fontWeight: '600' }}>Watch ›</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>
    );
  }

  // ── Subject List Mode ─────────────────────────────────────────────────────────
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
            <Text style={styles.listLabel}>Select a subject to view Videos & Notes</Text>
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
              onPress={() => {
                setSelectedSubject(item);
                setActiveTab('videos');
              }}
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
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  backText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 4, lineHeight: 30 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 12 },
  overallTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden' },
  overallFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 3 },
  listLabel: {
    fontSize: 13, fontWeight: '600', color: Colors.textMuted,
    marginHorizontal: 20, marginTop: 20, marginBottom: 10,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  subTabsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  subTab: {
    flex: 1, paddingVertical: 9, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center',
  },
  subTabActive: { backgroundColor: '#FFFFFF' },
  subTabText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  subTabTextActive: { color: '#4F46E5' },
  // ── Subject Card ─────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    marginHorizontal: 16, marginBottom: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  iconCircle: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconText: { fontSize: 26 },
  cardInfo: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, flex: 1 },
  completeBadge: { fontSize: 11, fontWeight: '700', color: '#22C55E', backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
  cardDesc: { fontSize: 12, color: Colors.textSecondary, marginBottom: 8, lineHeight: 17 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progressLabel: { fontSize: 11, color: Colors.textMuted },
  progressPct: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },
  progressTrack: { height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  arrow: { fontSize: 26, color: Colors.textMuted, fontWeight: '300' },
  // ── Notes View Styles ────────────────────────────────────────────────────────
  notesContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  notesControls: { backgroundColor: '#FFFFFF', padding: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 10 },
  notesSearchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  searchIconText: { fontSize: 14 },
  notesSearchInput: { flex: 1, fontSize: 14, color: Colors.text, padding: 0 },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sortLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, marginRight: 4 },
  sortChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: '#F3F4F6', marginRight: 6 },
  sortChipActive: { backgroundColor: '#4F46E5' },
  sortChipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  sortChipTextActive: { color: '#FFFFFF' },
  filterChipRow: { flexDirection: 'row', gap: 8 },
  typeFilterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, backgroundColor: '#F3F4F6' },
  typeFilterChipActive: { backgroundColor: '#4F46E5' },
  typeFilterChipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '700' },
  typeFilterChipTextActive: { color: '#FFFFFF' },
  noteCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  noteFileIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  noteFileType: { fontSize: 9, fontWeight: '800', marginTop: 1 },
  noteTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  noteDesc: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  chapterBadge: { fontSize: 11, color: '#4F46E5', fontWeight: '600', marginBottom: 2 },
  noteDate: { fontSize: 11, color: Colors.textMuted },
  noteActions: { flexDirection: 'column', gap: 6, flexShrink: 0 },
  viewNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  viewNoteBtnText: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },
  printNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  printNoteBtnText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  subSectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6, textTransform: 'uppercase' },
  lessonRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 10 },
  lessonTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  lessonDuration: { fontSize: 11, color: Colors.textMuted },
  emptyBox: { alignItems: 'center', paddingVertical: 50, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});

