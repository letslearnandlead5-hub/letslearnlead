import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { paymentService } from '../../services/paymentService';
import { Payment, PaymentSummary } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Colors } from '../../theme';

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_CONFIG = {
  pending:  { color: '#F59E0B', bg: '#FEF3C7', icon: '⏳', label: 'Pending Verification' },
  approved: { color: '#22C55E', bg: '#DCFCE7', icon: '✅', label: 'Approved' },
  rejected: { color: '#EF4444', bg: '#FEF2F2', icon: '❌', label: 'Rejected' },
};

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all',      label: 'All' },
  { id: 'pending',  label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

// ─── Payment Card ─────────────────────────────────────────────────────────────
const PaymentCard = ({ payment }: { payment: Payment }) => {
  const st = STATUS_CONFIG[payment.paymentStatus];
  const course = payment.courseId as any;
  const courseName = typeof course === 'object' ? course.title : payment.courseName;
  const date = new Date(payment.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const currencySymbol = payment.currency === 'INR' ? '₹' : payment.currency;

  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: st.color }]} />
      <View style={styles.cardBody}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardCourse} numberOfLines={1}>{courseName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.color }]}>
              {st.icon} {st.label}
            </Text>
          </View>
        </View>

        {/* Amount */}
        <Text style={styles.cardAmount}>
          {currencySymbol}{payment.amount?.toLocaleString('en-IN') || '—'}
        </Text>

        {/* Details */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{payment.transactionId}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Submitted On</Text>
            <Text style={styles.detailValue}>{date}</Text>
          </View>
        </View>

        {/* Admin remark for rejected */}
        {payment.paymentStatus === 'rejected' && payment.adminRemark && (
          <View style={styles.remarkBox}>
            <Text style={styles.remarkIcon}>⚠️</Text>
            <Text style={styles.remarkText}>{payment.adminRemark}</Text>
          </View>
        )}

        {/* Approval note */}
        {payment.paymentStatus === 'approved' && (
          <View style={[styles.remarkBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
            <Text style={styles.remarkIcon}>✅</Text>
            <Text style={[styles.remarkText, { color: '#15803D' }]}>
              Your enrollment is active! Visit My Courses to start learning.
            </Text>
          </View>
        )}

        {/* Pending hint */}
        {payment.paymentStatus === 'pending' && (
          <View style={[styles.remarkBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
            <Text style={styles.remarkIcon}>⏳</Text>
            <Text style={[styles.remarkText, { color: '#92400E' }]}>
              Verification usually takes 24–48 hours. We'll notify you.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Stats strip ─────────────────────────────────────────────────────────────
const StatsStrip = ({ summary }: { summary: PaymentSummary }) => (
  <View style={styles.statsStrip}>
    {[
      { label: 'Pending',  val: summary.pending,  icon: '⏳', col: '#F59E0B' },
      { label: 'Approved', val: summary.approved, icon: '✅', col: '#22C55E' },
      { label: 'Rejected', val: summary.rejected, icon: '❌', col: '#EF4444' },
    ].map(s => (
      <View key={s.label} style={styles.stripItem}>
        <Text style={styles.stripIcon}>{s.icon}</Text>
        <Text style={[styles.stripVal, { color: s.col }]}>{s.val}</Text>
        <Text style={styles.stripLabel}>{s.label}</Text>
      </View>
    ))}
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
export const MyPaymentsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({ pending: 0, approved: 0, rejected: 0 });
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    try {
      setError(null);
      const res = await paymentService.getMyPayments();
      setPayments(res.data || []);
      setSummary(res.summary || { pending: 0, approved: 0, rejected: 0 });
    } catch (err: any) {
      setError(err.userMessage || 'Failed to load payments.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadPayments(); }, []);

  const filtered = filter === 'all'
    ? payments
    : payments.filter(p => p.paymentStatus === filter);

  if (isLoading) return <LoadingSpinner fullScreen message="Loading payments…" />;
  if (error) return <ErrorMessage message={error} onRetry={loadPayments} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" translucent />
      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadPayments(); }}
            tintColor="#4F46E5"
          />
        }
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Header */}
            <LinearGradient
              colors={['#4F46E5', '#6366F1']}
              style={[styles.header, { paddingTop: insets.top + 16 }]}>
              <Text style={styles.headerTitle}>💳 My Payments</Text>
              <Text style={styles.headerSub}>Track your course payment history</Text>
              <StatsStrip summary={summary} />
            </LinearGradient>

            {/* Filters */}
            <View style={styles.filterRow}>
              {FILTERS.map(f => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.chip, filter === f.id && styles.chipActive]}
                  onPress={() => setFilter(f.id)}>
                  <Text style={[styles.chipText, filter === f.id && styles.chipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        renderItem={({ item }) => <PaymentCard payment={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'No payments yet' : `No ${filter} payments`}
            </Text>
            <Text style={styles.emptySub}>
              {filter === 'all'
                ? 'When you pay for a course, your payment history will appear here.'
                : 'Try switching to another filter.'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  // ── Header ───────────────────────────────────────────────────────────────────
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 18 },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 14,
  },
  stripItem: { flex: 1, alignItems: 'center', gap: 3 },
  stripIcon: { fontSize: 20 },
  stripVal: { fontSize: 22, fontWeight: '800' },
  stripLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  // ── Filter ───────────────────────────────────────────────────────────────────
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#4F46E5' },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },
  // ── Payment Card ──────────────────────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardAccent: { width: 5 },
  cardBody: { flex: 1, padding: 14 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  cardCourse: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardAmount: { fontSize: 26, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  detailsGrid: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  detailValue: { fontSize: 13, fontWeight: '600', color: Colors.text },
  remarkBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    alignItems: 'flex-start',
  },
  remarkIcon: { fontSize: 14, marginTop: 1 },
  remarkText: { flex: 1, fontSize: 12, color: '#DC2626', lineHeight: 18 },
  // ── Empty ────────────────────────────────────────────────────────────────────
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21 },
});
