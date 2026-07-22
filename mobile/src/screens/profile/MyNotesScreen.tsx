import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { noteService } from '../../services/noteService';
import { Note, MyNotesGroup, ProfileStackParamList } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Colors } from '../../theme';
import { SecurePdfViewer } from '../notes/SecurePdfViewer';

type NavProp = NativeStackNavigationProp<ProfileStackParamList, 'MyNotes'>;

// ─── File type config ─────────────────────────────────────────────────────────
const FILE_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  pdf:  { icon: '📄', color: '#EF4444', bg: '#FEF2F2', label: 'PDF' },
  txt:  { icon: '📝', color: '#6366F1', bg: '#EEF2FF', label: 'TXT' },
  doc:  { icon: '📚', color: '#2563EB', bg: '#EFF6FF', label: 'DOC' },
  html: { icon: '🌐', color: '#059669', bg: '#ECFDF5', label: 'HTML' },
  file: { icon: '📁', color: '#4F46E5', bg: '#EEF2FF', label: 'FILE' },
};

// ─── Section data structure for SectionList ───────────────────────────────────
interface SectionData {
  title: string;        // "Course Name → Subject Name"
  courseTitle: string;
  subjectName: string;
  data: Note[];
}

function buildSections(grouped: MyNotesGroup[]): SectionData[] {
  const sections: SectionData[] = [];
  for (const course of grouped) {
    for (const subject of course.subjects) {
      sections.push({
        title: `${course.courseTitle} › ${subject.subjectName}`,
        courseTitle: course.courseTitle,
        subjectName: subject.subjectName,
        data: subject.notes,
      });
    }
  }
  return sections;
}

// ─── Note row inside section ──────────────────────────────────────────────────
const NoteRow = ({
  note,
  onView,
  onPrint,
}: {
  note: Note;
  onView: () => void;
  onPrint: () => void;
}) => {
  const fc = FILE_CONFIG[note.fileType] || FILE_CONFIG.file;
  const date = new Date(note.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <View style={styles.noteRow}>
      {/* File type badge */}
      <View style={[styles.fileIconBox, { backgroundColor: fc.bg }]}>
        <Text style={styles.fileIconText}>{fc.icon}</Text>
        <Text style={[styles.fileTypeLabel, { color: fc.color }]}>{fc.label}</Text>
      </View>

      {/* Info */}
      <View style={styles.noteInfo}>
        <Text style={styles.noteTitle} numberOfLines={2}>{note.title}</Text>
        {note.description ? (
          <Text style={styles.noteDesc} numberOfLines={1}>{note.description}</Text>
        ) : null}
        <Text style={styles.noteMeta}>Updated {date}</Text>
      </View>

      {/* Actions */}
      <View style={styles.noteActions}>
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

// ─── Screen ───────────────────────────────────────────────────────────────────
export const MyNotesScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();

  const [sections, setSections] = useState<SectionData[]>([]);
  const [totalNotes, setTotalNotes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Viewer state
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerNote, setViewerNote] = useState<Note | null>(null);
  const [printPending, setPrintPending] = useState<Note | null>(null);

  const loadNotes = useCallback(async () => {
    try {
      setError(null);
      const res = await noteService.getMyNotes({ limit: 100 });
      setSections(buildSections(res.grouped || []));
      setTotalNotes(res.totalNotes);
    } catch (err: any) {
      console.error('[MY NOTES ERROR]', err);
      setError(err.userMessage || err.message || 'Failed to load notes.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const handleView = (note: Note) => {
    setViewerNote(note);
    setViewerVisible(true);
  };

  // For Print: open viewer first, then auto-trigger print once loaded
  const handlePrint = (note: Note) => {
    setPrintPending(note);
    setViewerNote(note);
    setViewerVisible(true);
  };

  const handleViewerClose = () => {
    setViewerVisible(false);
    setViewerNote(null);
    setPrintPending(null);
  };

  if (isLoading) return <LoadingSpinner fullScreen message="Loading your notes…" />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />

      {/* Secure PDF Viewer */}
      {viewerNote && (
        <SecurePdfViewer
          visible={viewerVisible}
          noteId={viewerNote._id}
          noteTitle={viewerNote.title}
          fileType={viewerNote.fileType}
          onClose={handleViewerClose}
        />
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadNotes(); }}
            tintColor="#4F46E5"
          />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <LinearGradient
              colors={['#4F46E5', '#6366F1']}
              style={[styles.header, { paddingTop: insets.top + 16 }]}
            >
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.backBtnText}>←</Text>
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>📂 My Study Notes</Text>
                <Text style={styles.headerSub}>
                  {isLoading ? '…' : `${totalNotes} note${totalNotes !== 1 ? 's' : ''} from your courses`}
                </Text>
              </View>
            </LinearGradient>

            {/* Security notice */}
            <View style={styles.securityBanner}>
              <Text style={styles.securityText}>
                🔒 Notes are view-only. Printing is allowed for personal study.
              </Text>
            </View>

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
                <TouchableOpacity onPress={loadNotes} style={styles.retryBtn}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionCourse}>
              <Text style={styles.sectionCourseText}>{section.courseTitle}</Text>
            </View>
            <Text style={styles.sectionSubject}>📚 {section.subjectName}</Text>
            <Text style={styles.sectionCount}>{section.data.length} note{section.data.length !== 1 ? 's' : ''}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <NoteRow
            note={item}
            onView={() => handleView(item)}
            onPrint={() => handlePrint(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyTitle}>No Notes Found</Text>
              <Text style={styles.emptySub}>
                Study notes will appear here for courses you are enrolled in.{'\n\n'}
                Enroll in a course to access study materials.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  backBtn: {
    marginTop: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },

  // ── Security banner ──────────────────────────────────────────────────────────
  securityBanner: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  securityText: { fontSize: 12, color: '#1D4ED8', lineHeight: 18 },

  // ── Error ───────────────────────────────────────────────────────────────────
  errorBox: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    alignItems: 'center',
    gap: 10,
  },
  errorText: { fontSize: 14, color: '#991B1B', textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // ── Section header ───────────────────────────────────────────────────────────
  sectionHeader: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4F46E5',
  },
  sectionCourse: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  sectionCourseText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubject: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
  },
  sectionCount: {
    fontSize: 11,
    color: '#6B7280',
  },

  // ── Note row ────────────────────────────────────────────────────────────────
  noteRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 12,
  },
  fileIconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fileIconText: { fontSize: 22 },
  fileTypeLabel: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase', marginTop: 1 },

  noteInfo: { flex: 1 },
  noteTitle: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
  noteDesc: { fontSize: 11, color: '#6B7280', marginBottom: 3 },
  noteMeta: { fontSize: 10, color: '#9CA3AF' },

  noteActions: { flexDirection: 'column', gap: 6, flexShrink: 0 },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  viewBtnIcon: { fontSize: 13 },
  viewBtnText: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },

  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  printBtnIcon: { fontSize: 13 },
  printBtnText: { fontSize: 11, fontWeight: '700', color: '#059669' },

  separator: { height: 1, backgroundColor: '#F3F4F6' },

  // ── Empty ────────────────────────────────────────────────────────────────────
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937', marginBottom: 10 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
});
