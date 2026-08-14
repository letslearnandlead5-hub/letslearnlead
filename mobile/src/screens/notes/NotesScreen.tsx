import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  TextInput,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useResponsiveSpacing } from '../../hooks/useResponsiveSpacing';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { noteService } from '../../services/noteService';
import { enrollmentService } from '../../services/enrollmentService';
import { Note, Enrollment, Course } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Colors } from '../../theme';
import { SecurePdfViewer } from './SecurePdfViewer';

// ─── File type config ─────────────────────────────────────────────────────────
const FILE_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  pdf:  { icon: '📄', color: '#EF4444', bg: '#FEF2F2', label: 'PDF' },
  txt:  { icon: '📝', color: '#6366F1', bg: '#EEF2FF', label: 'TXT' },
  doc:  { icon: '📚', color: '#2563EB', bg: '#EFF6FF', label: 'DOC' },
  file: { icon: '📁', color: '#4F46E5', bg: '#EEF2FF', label: 'FILE' },
  html: { icon: '🌐', color: '#059669', bg: '#ECFDF5', label: 'HTML' },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// ─── Note Card ────────────────────────────────────────────────────────────────
const NoteCard = ({
  note,
  onView,
  onPrint,
}: {
  note: Note;
  onView: () => void;
  onPrint: () => void;
}) => {
  const fc = FILE_CONFIG[note.fileType] || FILE_CONFIG.file;

  return (
    <View style={styles.card}>
      {/* File type icon */}
      <View style={[styles.fileIcon, { backgroundColor: fc.bg }]}>
        <Text style={styles.fileIconText}>{fc.icon}</Text>
        <Text style={[styles.fileTypeLabel, { color: fc.color }]}>{fc.label}</Text>
      </View>

      {/* Note info */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>{note.title}</Text>
        {note.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>{note.description}</Text>
        ) : null}

        <View style={styles.cardMeta}>
          {note.subjectName ? (
            <Text style={styles.subjectChip}>📚 {note.subjectName}</Text>
          ) : null}
          {note.chapterName ? (
            <Text style={styles.chapterChip}>📌 {note.chapterName}</Text>
          ) : null}
          <Text style={styles.metaDate}>{formatDate(note.createdAt)}</Text>
        </View>

        {note.tags && note.tags.length > 0 ? (
          <View style={styles.tagsRow}>
            {note.tags.slice(0, 3).map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {/* Action buttons — View & Print ONLY (no Download) */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.viewBtn} onPress={onView} activeOpacity={0.8}>
          <Text style={styles.viewBtnIcon}>👁</Text>
          <Text style={styles.viewBtnText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.printBtn} onPress={onPrint} activeOpacity={0.8}>
          <Text style={styles.printBtnIcon}>🖨</Text>
          <Text style={styles.printBtnText}>Print</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface EnrolledCourseItem {
  id: string;
  title: string;
  subjects: Array<{ id: string; name: string; icon?: string }>;
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export const NotesScreen: React.FC = () => {
  const { topInset, tabBarHeight } = useResponsiveSpacing();
  const [notes, setNotes] = useState<Note[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourseItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'txt' | 'html'>('all');

  // Secure viewer state
  const [viewerVisible, setViewerVisible] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  // Load enrolled courses
  const loadEnrolledCourses = useCallback(async () => {
    try {
      const res = await enrollmentService.getMyEnrollments();
      const list: Enrollment[] = (res.data || []).filter(
        e => e.status === 'paid' && e.courseId && typeof e.courseId === 'object'
      );

      const uniqueMap = new Map<string, EnrolledCourseItem>();
      list.forEach(e => {
        const c = e.courseId as Course;
        const cId = (c as any)?._id || (c as any)?.id;
        if (cId && !uniqueMap.has(cId)) {
          uniqueMap.set(cId, {
            id: cId,
            title: c.title || 'Course',
            subjects: (c.subjects || []).map((s: any) => ({
              id: s._id || s.id,
              name: s.name,
              icon: s.icon,
            })),
          });
        }
      });

      const coursesArr = Array.from(uniqueMap.values());
      setEnrolledCourses(coursesArr);
      if (coursesArr.length === 1) {
        setSelectedCourseId(coursesArr[0].id);
      }
    } catch (err: any) {
      console.warn('[NOTES SCREEN] Failed to load enrolled courses:', err);
    }
  }, []);

  const loadNotes = useCallback(async (q?: string, ft?: string, cId?: string, sId?: string) => {
    try {
      setError(null);
      const params: any = {
        search: q || undefined,
        fileType: ft && ft !== 'all' ? ft : undefined,
      };
      if (cId && cId !== 'all') params.courseId = cId;
      if (sId && sId !== 'all') params.subjectId = sId;

      const res = await noteService.getNotes(params);
      setNotes(res.data || []);
    } catch (err: any) {
      setError(err.userMessage || 'Failed to load notes.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEnrolledCourses();
    loadNotes();
  }, []);

  // Filter notes on search/filter changes
  useEffect(() => {
    const t = setTimeout(() => {
      loadNotes(search, filterType, selectedCourseId, selectedSubjectId);
    }, 300);
    return () => clearTimeout(t);
  }, [search, filterType, selectedCourseId, selectedSubjectId]);

  const activeCourse = useMemo(() => {
    return enrolledCourses.find(c => c.id === selectedCourseId) || null;
  }, [enrolledCourses, selectedCourseId]);

  const availableSubjects = useMemo(() => {
    if (!activeCourse) return [];
    return activeCourse.subjects || [];
  }, [activeCourse]);

  const handleView = (note: Note) => {
    setActiveNote(note);
    setViewerVisible(true);
  };

  const handlePrint = (note: Note) => {
    setActiveNote(note);
    setViewerVisible(true);
  };

  const handleViewerClose = () => {
    setViewerVisible(false);
    setActiveNote(null);
  };

  if (isLoading) return <LoadingSpinner fullScreen message="Loading notes…" />;
  if (error && notes.length === 0) return <ErrorMessage message={error} onRetry={() => loadNotes()} />;

  return (
    <ScreenContainer edges={['left', 'right']}>
      {/* Secure PDF Viewer */}
      {activeNote && (
        <SecurePdfViewer
          visible={viewerVisible}
          noteId={activeNote._id}
          noteTitle={activeNote.title}
          fileType={activeNote.fileType}
          onClose={handleViewerClose}
        />
      )}

      <FlatList
        data={notes}
        keyExtractor={item => item._id}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadEnrolledCourses();
              loadNotes(search, filterType, selectedCourseId, selectedSubjectId);
            }}
            tintColor="#4F46E5"
          />
        }
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Header */}
            <LinearGradient
              colors={['#4F46E5', '#6366F1']}
              style={[styles.header, { paddingTop: topInset + 16 }]}
            >
              <Text style={styles.headerTitle}>📂 Study Notes</Text>
              <Text style={styles.headerSub}>
                {notes.length} {notes.length === 1 ? 'note' : 'notes'} available across subjects
              </Text>
              <Text style={styles.headerSecure}>🔒 View-only · Printing allowed</Text>

              {/* Search */}
              <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search notes, chapters, or subjects…"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="none"
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Text style={styles.searchClear}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>

            {/* Course Selector Tabs (If multiple courses) */}
            {enrolledCourses.length > 1 && (
              <View style={styles.sectionHeaderBox}>
                <Text style={styles.sectionTitle}>Courses</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
                  <TouchableOpacity
                    style={[styles.coursePill, selectedCourseId === 'all' && styles.coursePillActive]}
                    onPress={() => {
                      setSelectedCourseId('all');
                      setSelectedSubjectId('all');
                    }}
                  >
                    <Text style={[styles.coursePillText, selectedCourseId === 'all' && styles.coursePillTextActive]}>
                      All Courses
                    </Text>
                  </TouchableOpacity>
                  {enrolledCourses.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.coursePill, selectedCourseId === c.id && styles.coursePillActive]}
                      onPress={() => {
                        setSelectedCourseId(c.id);
                        setSelectedSubjectId('all');
                      }}
                    >
                      <Text style={[styles.coursePillText, selectedCourseId === c.id && styles.coursePillTextActive]}>
                        🎓 {c.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Subject Selector Pills (Under selected course) */}
            {availableSubjects.length > 0 && (
              <View style={styles.sectionHeaderBox}>
                <Text style={styles.sectionTitle}>Subjects</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
                  <TouchableOpacity
                    style={[styles.subjectPill, selectedSubjectId === 'all' && styles.subjectPillActive]}
                    onPress={() => setSelectedSubjectId('all')}
                  >
                    <Text style={[styles.subjectPillText, selectedSubjectId === 'all' && styles.subjectPillTextActive]}>
                      All Subjects
                    </Text>
                  </TouchableOpacity>
                  {availableSubjects.map(sub => (
                    <TouchableOpacity
                      key={sub.id}
                      style={[styles.subjectPill, selectedSubjectId === sub.id && styles.subjectPillActive]}
                      onPress={() => setSelectedSubjectId(sub.id)}
                    >
                      <Text style={[styles.subjectPillText, selectedSubjectId === sub.id && styles.subjectPillTextActive]}>
                        {sub.icon ? `${sub.icon} ` : '📚 '}{sub.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Format Filter */}
            <View style={styles.filterRow}>
              {(['all', 'pdf', 'html', 'txt'] as const).map(ft => {
                const fc = ft === 'all' ? null : FILE_CONFIG[ft];
                return (
                  <TouchableOpacity
                    key={ft}
                    style={[styles.filterChip, filterType === ft && styles.filterChipActive]}
                    onPress={() => setFilterType(ft)}
                  >
                    {fc && <Text style={styles.filterChipIcon}>{fc.icon}</Text>}
                    <Text style={[styles.filterChipText, filterType === ft && styles.filterChipTextActive]}>
                      {ft === 'html' ? 'ONLINE' : ft.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        }
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            onView={() => handleView(item)}
            onPrint={() => handlePrint(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>
              {search ? 'No results found' : 'No notes available'}
            </Text>
            <Text style={styles.emptySub}>
              {search
                ? `No notes match "${search}". Try a different search.`
                : 'Study notes for your selected course and subjects will appear here.'}
            </Text>
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')} style={styles.clearSearchBtn}>
                <Text style={styles.clearSearchText}>Clear Search</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  // ── Header ───────────────────────────────────────────────────────────────────
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 2 },
  headerSecure: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 13, color: '#fff', padding: 0 },
  searchClear: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },

  // ── Section Pills ────────────────────────────────────────────────────────────
  sectionHeaderBox: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  pillsScroll: {
    flexDirection: 'row',
  },
  coursePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  coursePillActive: {
    backgroundColor: '#4F46E5',
  },
  coursePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  coursePillTextActive: {
    color: '#fff',
  },
  subjectPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    marginRight: 8,
  },
  subjectPillActive: {
    backgroundColor: '#7C3AED',
  },
  subjectPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6D28D9',
  },
  subjectPillTextActive: {
    color: '#fff',
  },

  // ── Filter ───────────────────────────────────────────────────────────────────
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  filterChipActive: { backgroundColor: '#4F46E5' },
  filterChipIcon: { fontSize: 12 },
  filterChipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filterChipTextActive: { color: '#fff' },

  // ── Note Card ─────────────────────────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fileIconText: { fontSize: 20 },
  fileTypeLabel: { fontSize: 8, fontWeight: '800', marginTop: 1, textTransform: 'uppercase' },

  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  cardDesc: { fontSize: 11, color: Colors.textSecondary, marginBottom: 5, lineHeight: 16 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  subjectChip: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6D28D9',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  chapterChip: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textSecondary,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaDate: { fontSize: 10, color: Colors.textMuted },
  tagsRow: { flexDirection: 'row', gap: 4, marginTop: 5, flexWrap: 'wrap' },
  tag: { backgroundColor: '#EEF2FF', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 },
  tagText: { fontSize: 9, color: '#4F46E5', fontWeight: '600' },

  // ── Action buttons ────────────────────────────────────────────────────────────
  cardActions: {
    flexDirection: 'column',
    gap: 5,
    flexShrink: 0,
    justifyContent: 'center',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 3,
    minWidth: 58,
    justifyContent: 'center',
  },
  viewBtnIcon: { fontSize: 12 },
  viewBtnText: { fontSize: 10, fontWeight: '700', color: '#4F46E5' },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 3,
    minWidth: 58,
    justifyContent: 'center',
  },
  printBtnIcon: { fontSize: 12 },
  printBtnText: { fontSize: 10, fontWeight: '700', color: '#059669' },

  // ── Empty ────────────────────────────────────────────────────────────────────
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 54, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  clearSearchBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#EEF2FF', borderRadius: 10 },
  clearSearchText: { fontSize: 13, color: '#4F46E5', fontWeight: '600' },
});
