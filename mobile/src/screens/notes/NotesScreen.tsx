import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useResponsiveSpacing } from '../../hooks/useResponsiveSpacing';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { noteService } from '../../services/noteService';
import { Note } from '../../types';
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
            <Text style={styles.metaChip}>📚 {note.subjectName}</Text>
          ) : null}
          {note.chapterName ? (
            <Text style={styles.metaChip}>📌 {note.chapterName}</Text>
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

// ─── Screen ───────────────────────────────────────────────────────────────────
export const NotesScreen: React.FC = () => {
  const { topInset, tabBarHeight } = useResponsiveSpacing();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'txt'>('all');

  // Secure viewer state
  const [viewerVisible, setViewerVisible] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  const loadNotes = useCallback(async (q?: string, ft?: string) => {
    try {
      setError(null);
      const res = await noteService.getNotes({
        search: q || undefined,
        fileType: ft && ft !== 'all' ? ft : undefined,
      });
      setNotes(res.data || []);
    } catch (err: any) {
      setError(err.userMessage || 'Failed to load notes.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadNotes(); }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => loadNotes(search, filterType), 400);
    return () => clearTimeout(t);
  }, [search, filterType]);

  const handleView = (note: Note) => {
    setActiveNote(note);
    setViewerVisible(true);
  };

  // Print: open viewer (which has a print button in the header)
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
        contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadNotes(search, filterType); }}
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
                {notes.length} {notes.length === 1 ? 'note' : 'notes'} available
              </Text>
              <Text style={styles.headerSecure}>🔒 View-only · Printing allowed</Text>

              {/* Search */}
              <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search notes…"
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

            {/* Type filter */}
            <View style={styles.filterRow}>
              {(['all', 'pdf', 'txt'] as const).map(ft => {
                const fc = ft === 'all' ? null : FILE_CONFIG[ft];
                return (
                  <TouchableOpacity
                    key={ft}
                    style={[styles.filterChip, filterType === ft && styles.filterChipActive]}
                    onPress={() => setFilterType(ft)}
                  >
                    {fc && <Text style={styles.filterChipIcon}>{fc.icon}</Text>}
                    <Text style={[styles.filterChipText, filterType === ft && styles.filterChipTextActive]}>
                      {ft.toUpperCase()}
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
                : 'Study notes for your enrolled courses will appear here.'}
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
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
  headerSecure: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: '#fff', padding: 0 },
  searchClear: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },

  // ── Filter ───────────────────────────────────────────────────────────────────
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    gap: 4,
  },
  filterChipActive: { backgroundColor: '#4F46E5' },
  filterChipIcon: { fontSize: 13 },
  filterChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterChipTextActive: { color: '#fff' },

  // ── Note Card ─────────────────────────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  fileIcon: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fileIconText: { fontSize: 24 },
  fileTypeLabel: { fontSize: 9, fontWeight: '800', marginTop: 1, textTransform: 'uppercase' },

  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  cardDesc: { fontSize: 12, color: Colors.textSecondary, marginBottom: 6, lineHeight: 17 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  metaChip: { fontSize: 11, color: Colors.textSecondary },
  metaDate: { fontSize: 11, color: Colors.textMuted },
  tagsRow: { flexDirection: 'row', gap: 5, marginTop: 6, flexWrap: 'wrap' },
  tag: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 10, color: '#4F46E5', fontWeight: '600' },

  // ── Action buttons ────────────────────────────────────────────────────────────
  cardActions: {
    flexDirection: 'column',
    gap: 6,
    flexShrink: 0,
    justifyContent: 'center',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
    minWidth: 62,
    justifyContent: 'center',
  },
  viewBtnIcon: { fontSize: 14 },
  viewBtnText: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
    minWidth: 62,
    justifyContent: 'center',
  },
  printBtnIcon: { fontSize: 14 },
  printBtnText: { fontSize: 11, fontWeight: '700', color: '#059669' },

  // ── Empty ────────────────────────────────────────────────────────────────────
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 20 },
  clearSearchBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#EEF2FF', borderRadius: 12 },
  clearSearchText: { fontSize: 14, color: '#4F46E5', fontWeight: '600' },
});
