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
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useResponsiveSpacing } from '../../hooks/useResponsiveSpacing';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { doubtService, CreateDoubtPayload } from '../../services/doubtService';
import { Doubt } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Colors, Spacing } from '../../theme';

const STATUS_CONFIG = {
  open:        { color: '#6366F1', bg: '#EEF2FF', icon: '🔔', label: 'Open' },
  'in-progress':{ color: '#F59E0B', bg: '#FEF3C7', icon: '⏳', label: 'In Progress' },
  resolved:    { color: '#22C55E', bg: '#DCFCE7', icon: '✅', label: 'Resolved' },
  closed:      { color: '#6B7280', bg: '#F3F4F6', icon: '🔒', label: 'Closed' },
};

const PRIORITY_CONFIG = {
  low:    { color: '#22C55E', label: 'Low' },
  medium: { color: '#F59E0B', label: 'Medium' },
  high:   { color: '#EF4444', label: 'High' },
};

const CATEGORIES: Doubt['category'][] = ['general', 'technical', 'academic', 'payment', 'other'];
const PRIORITIES: Doubt['priority'][]  = ['low', 'medium', 'high'];

// ─── Doubt card ───────────────────────────────────────────────────────────────
const DoubtCard = ({ doubt, onPress }: { doubt: Doubt; onPress: () => void }) => {
  const st = STATUS_CONFIG[doubt.status] || STATUS_CONFIG.open;
  const pr = PRIORITY_CONFIG[doubt.priority];
  const date = new Date(doubt.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.cardAccent, { backgroundColor: st.color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardSubject} numberOfLines={1}>{doubt.subject}</Text>
          <View style={[styles.badge, { backgroundColor: st.bg }]}>
            <Text style={[styles.badgeText, { color: st.color }]}>{st.icon} {st.label}</Text>
          </View>
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>{doubt.description}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>{date}</Text>
          <View style={[styles.priBadge, { backgroundColor: pr.color + '20' }]}>
            <Text style={[styles.priText, { color: pr.color }]}>{pr.label} Priority</Text>
          </View>
          {doubt.courseName && (
            <Text style={styles.cardCourse} numberOfLines={1}>📚 {doubt.courseName}</Text>
          )}
        </View>
        {doubt.response && (
          <View style={styles.replyBanner}>
            <Text style={styles.replyIcon}>💬</Text>
            <Text style={styles.replyText} numberOfLines={2}>{doubt.response}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── Submit Doubt Modal ───────────────────────────────────────────────────────
const SubmitModal = ({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateDoubtPayload) => Promise<void>;
}) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Doubt['category']>('general');
  const [priority, setPriority] = useState<Doubt['priority']>('medium');
  const [loading, setLoading] = useState(false);

  const reset = () => { setSubject(''); setDescription(''); setCategory('general'); setPriority('medium'); };

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Required', 'Please fill in both subject and description.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ subject: subject.trim(), description: description.trim(), category, priority });
      reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>💬 Ask a Doubt</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            {/* Subject */}
            <Text style={styles.fieldLabel}>Subject *</Text>
            <TextInput
              style={styles.input}
              placeholder="What is your doubt about?"
              value={subject}
              onChangeText={setSubject}
              maxLength={120}
              placeholderTextColor={Colors.textMuted}
            />

            {/* Description */}
            <Text style={styles.fieldLabel}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Describe your doubt in detail..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              maxLength={1000}
              textAlignVertical="top"
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.charCount}>{description.length}/1000</Text>

            {/* Category */}
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, category === c && styles.chipSelected]}
                  onPress={() => setCategory(c)}>
                  <Text style={[styles.chipTxt, category === c && styles.chipTxtSelected]}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Priority */}
            <Text style={styles.fieldLabel}>Priority</Text>
            <View style={styles.chipRow}>
              {PRIORITIES.map(p => {
                const pc = PRIORITY_CONFIG[p];
                return (
                  <TouchableOpacity
                    key={p}
                    style={[styles.chip, priority === p && { backgroundColor: pc.color, borderColor: pc.color }]}
                    onPress={() => setPriority(p)}>
                    <Text style={[styles.chipTxt, priority === p && { color: '#fff' }]}>
                      {pc.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.submitBtnWrap}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.9}>
              <LinearGradient colors={['#4F46E5', '#6366F1']} style={styles.submitBtn}>
                <Text style={styles.submitBtnText}>{loading ? 'Submitting…' : '✅ Submit Doubt'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Doubt Detail Modal ───────────────────────────────────────────────────────
const DetailModal = ({ doubt, onClose }: { doubt: Doubt | null; onClose: () => void }) => {
  if (!doubt) return null;
  const st = STATUS_CONFIG[doubt.status];
  return (
    <Modal visible={!!doubt} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle} numberOfLines={1}>{doubt.subject}</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalScroll}>
          <View style={[styles.badge, { backgroundColor: st.bg, alignSelf: 'flex-start', marginBottom: 14 }]}>
            <Text style={[styles.badgeText, { color: st.color }]}>{st.icon} {st.label}</Text>
          </View>
          <Text style={styles.detailSectionLabel}>Your Question</Text>
          <Text style={styles.detailBody}>{doubt.description}</Text>

          {doubt.response ? (
            <>
              <Text style={[styles.detailSectionLabel, { marginTop: 20, color: '#22C55E' }]}>
                ✅ Response from Team
              </Text>
              <View style={styles.responseBox}>
                <Text style={styles.responseBody}>{doubt.response}</Text>
                {doubt.respondedBy && (
                  <Text style={styles.respondedBy}>— {(doubt.respondedBy as any).name}</Text>
                )}
              </View>
            </>
          ) : (
            <View style={styles.pendingBox}>
              <Text style={styles.pendingText}>⏳ No response yet. Our team will reply soon.</Text>
            </View>
          )}

          <Text style={styles.metaRow}>
            Submitted on {new Date(doubt.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const MyDoubtsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [selectedDoubt, setSelectedDoubt] = useState<Doubt | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  const loadDoubts = useCallback(async () => {
    try {
      setError(null);
      const res = await doubtService.getMyDoubts({ limit: 50 });
      setDoubts(res.data || []);
    } catch (err: any) {
      setError(err.userMessage || 'Failed to load doubts.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadDoubts(); }, []);

  const handleSubmitDoubt = async (payload: CreateDoubtPayload) => {
    await doubtService.createDoubt(payload);
    setShowSubmit(false);
    loadDoubts();
    Alert.alert('✅ Submitted', 'Your doubt has been submitted. We\'ll respond soon!');
  };

  const filtered = filter === 'all' ? doubts
    : filter === 'open' ? doubts.filter(d => d.status === 'open' || d.status === 'in-progress')
    : doubts.filter(d => d.status === 'resolved' || d.status === 'closed');

  const stats = {
    total: doubts.length,
    open: doubts.filter(d => d.status === 'open' || d.status === 'in-progress').length,
    resolved: doubts.filter(d => d.status === 'resolved').length,
  };

  if (isLoading) return <LoadingSpinner fullScreen message="Loading doubts…" />;
  if (error) return <ErrorMessage message={error} onRetry={loadDoubts} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" translucent />

      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDoubts(); }} tintColor="#4F46E5" />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <LinearGradient
              colors={['#4F46E5', '#6366F1']}
              style={[styles.header, { paddingTop: insets.top + 16 }]}>
              <Text style={styles.headerTitle}>💬 My Doubts</Text>
              <Text style={styles.headerSub}>Ask anything, anytime</Text>
              <View style={styles.statsStrip}>
                {[
                  { label: 'Total', val: stats.total, icon: '💬' },
                  { label: 'Open', val: stats.open, icon: '🔔' },
                  { label: 'Resolved', val: stats.resolved, icon: '✅' },
                ].map(s => (
                  <View key={s.label} style={styles.stripItem}>
                    <Text style={styles.stripIcon}>{s.icon}</Text>
                    <Text style={styles.stripVal}>{s.val}</Text>
                    <Text style={styles.stripLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>

            {/* Filter + FAB */}
            <View style={styles.filterRow}>
              {(['all', 'open', 'resolved'] as const).map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, filter === f && styles.filterChipActive]}
                  onPress={() => setFilter(f)}>
                  <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.askBtn}
                onPress={() => setShowSubmit(true)}>
                <LinearGradient colors={['#4F46E5', '#6366F1']} style={styles.askBtnGrad}>
                  <Text style={styles.askBtnText}>+ Ask</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <DoubtCard doubt={item} onPress={() => setSelectedDoubt(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No doubts yet</Text>
            <Text style={styles.emptySub}>Ask your first question and get it answered by our team!</Text>
            <TouchableOpacity style={styles.emptyAskBtn} onPress={() => setShowSubmit(true)}>
              <LinearGradient colors={['#4F46E5', '#6366F1']} style={styles.emptyAskGrad}>
                <Text style={styles.emptyAskText}>+ Ask a Doubt</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
      />

      <SubmitModal visible={showSubmit} onClose={() => setShowSubmit(false)} onSubmit={handleSubmitDoubt} />
      <DetailModal doubt={selectedDoubt} onClose={() => setSelectedDoubt(null)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 20 },
  statsStrip: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 14, gap: 8 },
  stripItem: { flex: 1, alignItems: 'center', gap: 2 },
  stripIcon: { fontSize: 20 },
  stripVal: { fontSize: 22, fontWeight: '800', color: '#fff' },
  stripLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, gap: 8, alignItems: 'center' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#E5E7EB' },
  filterChipActive: { backgroundColor: '#4F46E5' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterChipTextActive: { color: '#fff' },
  askBtn: { marginLeft: 'auto', borderRadius: 20, overflow: 'hidden' },
  askBtnGrad: { paddingHorizontal: 16, paddingVertical: 7 },
  askBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  // ── Card ─────────────────────────────────────────────────────────────────────
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardAccent: { width: 5 },
  cardBody: { flex: 1, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, gap: 8 },
  cardSubject: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, marginBottom: 10, lineHeight: 19 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardDate: { fontSize: 11, color: Colors.textMuted },
  priBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  priText: { fontSize: 11, fontWeight: '600' },
  cardCourse: { fontSize: 11, color: Colors.textMuted, flex: 1 },
  replyBanner: { flexDirection: 'row', backgroundColor: '#F0FDF4', borderRadius: 8, padding: 8, marginTop: 10, gap: 6 },
  replyIcon: { fontSize: 14 },
  replyText: { flex: 1, fontSize: 12, color: '#16A34A', lineHeight: 18 },
  // ── Empty ────────────────────────────────────────────────────────────────────
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  emptyAskBtn: { borderRadius: 12, overflow: 'hidden', width: '100%' },
  emptyAskGrad: { paddingVertical: 14, alignItems: 'center' },
  emptyAskText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  // ── Modal ────────────────────────────────────────────────────────────────────
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, flex: 1 },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontSize: 14, color: Colors.text },
  modalScroll: { padding: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, fontSize: 14, color: Colors.text, backgroundColor: '#FAFAFA' },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: Colors.textMuted, textAlign: 'right', marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: '#E5E7EB' },
  chipSelected: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  chipTxt: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTxtSelected: { color: '#4F46E5' },
  submitBtnWrap: { marginTop: 24, borderRadius: 14, overflow: 'hidden' },
  submitBtn: { paddingVertical: 16, alignItems: 'center' },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  // ── Detail modal ─────────────────────────────────────────────────────────────
  detailSectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  detailBody: { fontSize: 15, color: Colors.text, lineHeight: 23 },
  responseBox: { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#BBF7D0' },
  responseBody: { fontSize: 14, color: '#15803D', lineHeight: 22 },
  respondedBy: { fontSize: 12, color: '#16A34A', marginTop: 8, fontWeight: '600' },
  pendingBox: { backgroundColor: '#FFFBEB', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#FDE68A', marginTop: 16 },
  pendingText: { fontSize: 13, color: '#92400E' },
  metaRow: { fontSize: 11, color: Colors.textMuted, marginTop: 20 },
});
