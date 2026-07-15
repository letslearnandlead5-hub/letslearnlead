import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { enrollmentService } from '../../services/enrollmentService';
import { Enrollment, Certificate } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Colors } from '../../theme';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getCertNo = (enrollmentId: string) =>
  `CERT-${enrollmentId.slice(-8).toUpperCase()}`;

// ─── Certificate Card ─────────────────────────────────────────────────────────
const CertCard = ({ cert }: { cert: Certificate }) => {
  const certNo = getCertNo(cert.enrollmentId);
  const date = new Date(cert.completionDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const handleShare = async () => {
    try {
      await Share.share({
        title: `Certificate — ${cert.courseTitle}`,
        message: `🎓 I completed "${cert.courseTitle}"!\nCertificate No: ${certNo}\nCompleted on: ${date}\n\n#LetsLearnAndLead`,
      });
    } catch (e) {
      Alert.alert('Share failed', 'Could not share certificate.');
    }
  };

  return (
    <View style={styles.certCard}>
      {/* Decorative top strip */}
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.certStrip}>
        <Text style={styles.certOrgName}>Lets Learn & Lead</Text>
        <Text style={styles.certOf}>Certificate of Completion</Text>
      </LinearGradient>

      {/* Gold seal */}
      <View style={styles.sealRow}>
        <View style={styles.seal}>
          <Text style={styles.sealIcon}>🏅</Text>
          <Text style={styles.sealText}>100%</Text>
        </View>
        <View style={styles.certMeta}>
          <Text style={styles.certTitleLabel}>Course Completed</Text>
          <Text style={styles.certTitle} numberOfLines={2}>{cert.courseTitle}</Text>
          {cert.instructor && (
            <Text style={styles.certInstructor}>👨‍🏫 {cert.instructor}</Text>
          )}
        </View>
      </View>

      {/* Divider */}
      <View style={styles.certDivider} />

      {/* Bottom info */}
      <View style={styles.certFooter}>
        <View style={styles.certFooterItem}>
          <Text style={styles.certFooterLabel}>Certificate No.</Text>
          <Text style={styles.certFooterVal}>{certNo}</Text>
        </View>
        <View style={styles.certFooterItem}>
          <Text style={styles.certFooterLabel}>Completed On</Text>
          <Text style={styles.certFooterVal}>{date}</Text>
        </View>

        {/* Share */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
          <LinearGradient colors={['#4F46E5', '#6366F1']} style={styles.shareBtnGrad}>
            <Text style={styles.shareBtnText}>🔗 Share</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export const CertificatesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCertificates = useCallback(async () => {
    try {
      setError(null);
      const res = await enrollmentService.getMyEnrollments();
      const completedEnrollments: Certificate[] = (res.data || [])
        .filter((e: Enrollment) => e.completionPercentage >= 100)
        .map((e: Enrollment) => {
          const course = e.courseId as any;
          return {
            enrollmentId: e._id || '',
            courseId: typeof course === 'object' ? course._id : course,
            courseTitle: typeof course === 'object' ? course.title : 'Unknown Course',
            courseThumbnail: typeof course === 'object' ? course.thumbnail : undefined,
            instructor: typeof course === 'object' ? course.instructor : undefined,
            completionDate: e.purchaseDate || e.createdAt || new Date().toISOString(),
            completionPercentage: e.completionPercentage,
          } as Certificate;
        });
      setCerts(completedEnrollments);
    } catch (err: any) {
      setError(err.userMessage || 'Failed to load certificates.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadCertificates(); }, []);

  const onRefresh = () => { setRefreshing(true); loadCertificates(); };

  if (isLoading) return <LoadingSpinner fullScreen message="Loading certificates…" />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" translucent />
      <FlatList
        data={certs}
        keyExtractor={item => item.enrollmentId}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
        }
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <Text style={styles.headerTitle}>🎓 My Certificates</Text>
            <Text style={styles.headerSub}>
              {certs.length === 0
                ? 'Complete a course to earn your certificate'
                : `${certs.length} certificate${certs.length > 1 ? 's' : ''} earned`}
            </Text>
            {certs.length > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>🏅 {certs.length} Earned</Text>
              </View>
            )}
          </LinearGradient>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <CertCard cert={item} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎓</Text>
            <Text style={styles.emptyTitle}>No Certificates Yet</Text>
            <Text style={styles.emptySub}>
              Complete 100% of any course to earn your certificate. Keep going!
            </Text>
            {/* Progress hint */}
            <View style={styles.hintCard}>
              <Text style={styles.hintIcon}>💡</Text>
              <Text style={styles.hintText}>
                Watch all video lessons in a course to reach 100% completion.
              </Text>
            </View>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  // ── Header ───────────────────────────────────────────────────────────────────
  header: { paddingHorizontal: 20, paddingBottom: 30 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 12 },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  // ── Certificate Card ──────────────────────────────────────────────────────────
  cardWrapper: { marginHorizontal: 16, marginTop: 20 },
  certCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  certStrip: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  certOrgName: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  certOf: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  sealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 16,
  },
  seal: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FEFCE8',
    borderWidth: 3,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sealIcon: { fontSize: 28 },
  sealText: { fontSize: 10, fontWeight: '800', color: '#D97706', marginTop: -2 },
  certMeta: { flex: 1 },
  certTitleLabel: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  certTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, lineHeight: 22, marginBottom: 5 },
  certInstructor: { fontSize: 12, color: Colors.textSecondary },
  certDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
  },
  certFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  certFooterItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  certFooterLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  certFooterVal: { fontSize: 13, fontWeight: '700', color: Colors.text },
  shareBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  shareBtnGrad: { paddingVertical: 12, alignItems: 'center' },
  shareBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  // ── Empty ────────────────────────────────────────────────────────────────────
  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 80, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 10 },
  emptySub: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  hintCard: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    alignItems: 'flex-start',
    width: '100%',
  },
  hintIcon: { fontSize: 20, marginTop: 1 },
  hintText: { flex: 1, fontSize: 13, color: '#4F46E5', lineHeight: 20 },
});
