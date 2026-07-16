import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Image,
  Dimensions,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeStackParamList, Course } from '../../types';
import { useCourses } from '../../context/CourseContext';
import { useAuth } from '../../context/AuthContext';
import { bannerService, Banner } from '../../services/bannerService';
import { notificationService } from '../../services/notificationService';
import { Colors, Typography, Spacing, Radius, Shadows, Gradients, CardSizes } from '../../theme';
import { useResponsiveSpacing } from '../../hooks/useResponsiveSpacing';
import { ScreenContainer } from '../../components/layout/ScreenContainer';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

const { width: SW } = Dimensions.get('window');

// DB-aligned category IDs with metadata
const CATEGORIES = [
  { id: 'school-6-10', name: 'School\n6–10', icon: '🏫', gradient: Gradients.school },
  { id: 'school-puc',  name: 'PUC\n11–12', icon: '🎓', gradient: Gradients.primaryLight },
  { id: 'neet',        name: 'NEET',        icon: '🩺', gradient: Gradients.neet },
  { id: 'jee',         name: 'JEE',         icon: '⚙️',  gradient: Gradients.jee },
  { id: 'kcet',        name: 'KCET',        icon: '📋', gradient: Gradients.kcet },
  { id: 'competitive', name: 'Compet.',     icon: '📝', gradient: Gradients.competitive },
];

const FALLBACK_BANNERS: any[] = [
  { _id: '1', title: 'Master Class 9 & 10', subtitle: 'All subjects in Kannada & English', cta: 'Explore Courses', discount: 'FREE TRIAL', image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600', bgGradient: ['#5B5FEF','#8B5CF6'], actionType: 'category', actionId: 'school-6-10', actionName: 'School (6–10)', isActive: true, order: 0 },
  { _id: '2', title: 'NEET Preparation 2025', subtitle: 'Crash course with expert faculty', cta: 'Start Now', discount: '50% OFF', image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600', bgGradient: ['#E53935','#FF7043'], actionType: 'category', actionId: 'neet', actionName: 'NEET', isActive: true, order: 1 },
  { _id: '3', title: 'JEE Main & Advanced', subtitle: 'Score 99 percentile this year', cta: 'Enroll Now', discount: '40% OFF', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600', bgGradient: ['#F59E0B','#FF6B35'], actionType: 'category', actionId: 'jee', actionName: 'JEE', isActive: true, order: 2 },
];

// ─── Greeting based on time ────────────────────────────────────────────────────
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
};

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { courses, isLoading, fetchCourses, refreshCourses } = useCourses();
  const { user } = useAuth();
  const { insets, topInset, tabBarHeight } = useResponsiveSpacing();

  const [refreshing, setRefreshing] = useState(false);
  const [continueLearning, setContinueLearning] = useState<any[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const bannerScrollRef = useRef<ScrollView>(null);
  const bannerIdxRef    = useRef(0);
  const bannerTimer     = useRef<NodeJS.Timeout | null>(null);

  // hero pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchCourses();
    loadContinueLearning();
    loadBanners();
    loadNotificationCount();
    startPulse();
    return () => stopBannerTimer();
  }, []);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  };

  // ── Banner auto-scroll ────────────────────────────────────────────────────
  useEffect(() => {
    if (banners.length > 1) startBannerTimer();
    return stopBannerTimer;
  }, [banners.length]);

  const startBannerTimer = useCallback(() => {
    stopBannerTimer();
    bannerTimer.current = setInterval(() => {
      const next = (bannerIdxRef.current + 1) % banners.length;
      bannerScrollRef.current?.scrollTo({ x: next * SW, animated: true });
      bannerIdxRef.current = next;
      setActiveBannerIdx(next);
    }, 3500);
  }, [banners.length]);

  const stopBannerTimer = useCallback(() => {
    if (bannerTimer.current) { clearInterval(bannerTimer.current); bannerTimer.current = null; }
  }, []);

  const handleBannerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
    if (idx !== bannerIdxRef.current && idx >= 0 && idx < banners.length) {
      bannerIdxRef.current = idx;
      setActiveBannerIdx(idx);
    }
  };

  // ── Data loaders ─────────────────────────────────────────────────────────
  const loadNotificationCount = async () => {
    try {
      const r = await notificationService.getNotifications(1, true);
      if (r.success) setUnreadCount(r.unreadCount || 0);
    } catch {}
  };

  const loadBanners = async () => {
    try {
      const r = await bannerService.getActiveBanners();
      if (r.success && r.data?.length) setBanners(r.data);
      else setBanners(FALLBACK_BANNERS);
    } catch {
      setBanners(FALLBACK_BANNERS);
    }
  };

  const loadContinueLearning = async () => {
    try {
      const { enrollmentService } = await import('../../services/enrollmentService');
      const r = await enrollmentService.getMyEnrollments();
      if (r.success && r.data) {
        const courses = r.data
          .filter((e: any) => e.status === 'paid' && typeof e.courseId === 'object')
          .map((e: any) => e.courseId)
          .slice(0, 5);
        setContinueLearning(courses);
      }
    } catch {}
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshCourses(), loadContinueLearning(), loadBanners(), loadNotificationCount()]);
    setRefreshing(false);
  }, [refreshCourses]);

  // ── Course segmentation ───────────────────────────────────────────────────
  const recommended = courses.filter(c => c.rating >= 4.5).sort((a,b) => b.rating - a.rating).slice(0, 10);
  const popular     = courses.filter(c => c.studentsEnrolled >= 50).sort((a,b) => b.studentsEnrolled - a.studentsEnrolled).slice(0, 10);
  const newCourses  = [...courses].reverse().slice(0, 10);

  const displayRecommended = recommended.length > 0 ? recommended : courses.slice(0, 10);
  const displayPopular     = popular.length > 0 ? popular : courses.slice(0, 10);
  const displayNew         = newCourses.length > 0 ? newCourses : courses.slice(0, 10);

  // ── Event handlers ────────────────────────────────────────────────────────
  const goToCourse = (course: Course) =>
    navigation.navigate('CourseDetail', { courseId: course._id, courseTitle: course.title });

  const handleBannerPress = (b: Banner) => {
    if (b.actionType === 'category')
      navigation.navigate('CategoryCourses', { categoryId: b.actionId || '', categoryName: b.actionName || '' });
    else if (b.actionType === 'course')
      navigation.navigate('CourseDetail', { courseId: b.actionId || '', courseTitle: b.actionName || '' });
    else if (b.actionType === 'search')
      navigation.navigate('Search', { initialQuery: b.actionQuery || '' });
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  Render helpers
  // ─────────────────────────────────────────────────────────────────────────

  const renderSectionHeader = (title: string, onSeeAll?: () => void) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  /** Horizontal course card — used in Popular & New Courses rows */
  const renderHCard = (course: Course) => (
    <TouchableOpacity
      key={course._id}
      style={styles.hCard}
      onPress={() => goToCourse(course)}
      activeOpacity={0.9}>
      <Image
        source={{ uri: course.thumbnail || 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400' }}
        style={styles.hCardImage}
        resizeMode="cover"
      />
      {/* Discount badge */}
      {course.originalPrice && course.originalPrice > (course.price ?? 0) && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>
            {Math.round(((course.originalPrice - (course.price ?? 0)) / course.originalPrice) * 100)}% OFF
          </Text>
        </View>
      )}
      <View style={styles.hCardBody}>
        <Text style={styles.hCardTitle} numberOfLines={2}>{course.title}</Text>
        <Text style={styles.hCardInstructor} numberOfLines={1}>👨‍🏫 {course.instructor}</Text>
        <View style={styles.hCardFooter}>
          <View style={styles.starRow}>
            <Text style={styles.starIcon}>★</Text>
            <Text style={styles.starText}>{course.rating?.toFixed(1) || '—'}</Text>
            <Text style={styles.enrolledText}>  ·  {course.studentsEnrolled} students</Text>
          </View>
        </View>
        <Text style={styles.hCardPrice}>
          {(course.price ?? 0) === 0 ? 'FREE' : `₹${course.price}`}
          {course.originalPrice && course.originalPrice > (course.price ?? 0) && (
            <Text style={styles.hCardOriginalPrice}>  ₹{course.originalPrice}</Text>
          )}
        </Text>
      </View>
    </TouchableOpacity>
  );

  /** 2-column grid card — used in Recommended & Recently Added */
  const renderGridCard = ({ item }: { item: Course }) => (
    <TouchableOpacity style={styles.gridCard} onPress={() => goToCourse(item)} activeOpacity={0.9}>
      <View style={styles.gridImageWrap}>
        <Image
          source={{ uri: item.thumbnail || 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400' }}
          style={styles.gridImage}
          resizeMode="cover"
        />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} style={styles.gridImageGrad} />
        <View style={styles.gridPriceBadge}>
          <Text style={styles.gridPriceText}>
            {(item.price ?? 0) === 0 ? 'FREE' : `₹${item.price}`}
          </Text>
        </View>
      </View>
      <View style={styles.gridBody}>
        <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.gridInstructor} numberOfLines={1}>{item.instructor}</Text>
        <View style={styles.gridMeta}>
          <Text style={styles.gridStar}>★ {item.rating?.toFixed(1) || '—'}</Text>
          {item.level && <View style={styles.levelChip}><Text style={styles.levelText}>{item.level}</Text></View>}
        </View>
      </View>
    </TouchableOpacity>
  );

  /** Continue Learning card */
  const renderContinueCard = (course: any) => {
    const progress = course.completionPercentage || 0;
    const actual = typeof course.courseId === 'object' ? course.courseId : course;
    return (
      <TouchableOpacity key={actual._id} style={styles.continueCard} onPress={() => goToCourse(actual)} activeOpacity={0.9}>
        <Image
          source={{ uri: actual.thumbnail || 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400' }}
          style={styles.continueImage}
          resizeMode="cover"
        />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.continueImageGrad} />
        <View style={styles.continueBody}>
          <Text style={styles.continueTitle} numberOfLines={2}>{actual.title}</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={Gradients.primary as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]}
              />
            </View>
            <Text style={styles.progressPct}>{progress}%</Text>
          </View>
          <TouchableOpacity style={styles.resumeBtn} onPress={() => goToCourse(actual)}>
            <Text style={styles.resumeBtnText}>Resume →</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  List Header (everything above the grid)
  // ─────────────────────────────────────────────────────────────────────────
  const ListHeader = () => (
    <View>
      {/* ── Top Header ──────────────────────────────────────────────── */}
      <LinearGradient
        colors={['#EEF0FF', '#F7F8FC']}
        style={[styles.topHeader, { paddingTop: topInset + 12 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name?.split(' ')[0] || 'Learner'} 👋
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => { navigation.navigate('Notifications'); setUnreadCount(0); }}>
              <Text style={styles.iconBtnText}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => navigation.navigate('ProfileTab' as any)}>
              <LinearGradient colors={Gradients.primary as [string, string]} style={styles.avatarGrad}>
                <Text style={styles.avatarText}>{(user?.name?.[0] || 'L').toUpperCase()}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Search Bar ──────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Search', {})}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search courses, subjects...</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* ── Banner Carousel ─────────────────────────────────────────── */}
      {banners.length > 0 && (
        <View style={styles.bannerSection}>
          <ScrollView
            ref={bannerScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            bounces={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleBannerScroll}
            onScrollBeginDrag={stopBannerTimer}
            onScrollEndDrag={startBannerTimer}>
            {banners.map(b => (
              <View key={b._id} style={{ width: SW, paddingHorizontal: Spacing.md }}>
                <TouchableOpacity activeOpacity={0.93} onPress={() => handleBannerPress(b)}>
                  <LinearGradient
                    colors={b.bgGradient as [string, string]}
                    style={styles.bannerCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}>
                    {/* Image background layer */}
                    <Image source={{ uri: b.image }} style={styles.bannerImage} resizeMode="cover" />
                    <LinearGradient
                      colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.1)']}
                      style={StyleSheet.absoluteFillObject}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                    />
                    {/* Content */}
                    <View style={styles.bannerContent}>
                      {b.discount && (
                        <View style={styles.bannerBadge}>
                          <Text style={styles.bannerBadgeText}>{b.discount}</Text>
                        </View>
                      )}
                      <Text style={styles.bannerTitle} numberOfLines={2}>{b.title}</Text>
                      <Text style={styles.bannerSubtitle} numberOfLines={2}>{b.subtitle}</Text>
                      <View style={styles.bannerCta}>
                        <Text style={styles.bannerCtaText}>{b.cta} →</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          {/* Pagination dots */}
          <View style={styles.dotsRow}>
            {banners.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => { bannerScrollRef.current?.scrollTo({ x: i * SW, animated: true }); bannerIdxRef.current = i; setActiveBannerIdx(i); }}>
                <Animated.View style={[styles.dot, i === activeBannerIdx && styles.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ── Category Pills ──────────────────────────────────────────── */}
      <View style={styles.section}>
        {renderSectionHeader('📚 Browse Categories', () => navigation.navigate('Categories'))}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catPills}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={styles.catPill}
              onPress={() => navigation.navigate('CategoryCourses', { categoryId: cat.id, categoryName: cat.name.replace('\n', ' ') })}
              activeOpacity={0.85}>
              <LinearGradient colors={cat.gradient as [string, string]} style={styles.catPillGrad}>
                <Text style={styles.catPillIcon}>{cat.icon}</Text>
                <Text style={styles.catPillName}>{cat.name}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Continue Learning ───────────────────────────────────────── */}
      {continueLearning.length > 0 && (
        <View style={styles.section}>
          {renderSectionHeader('🎯 Continue Learning', () => navigation.navigate('MyCoursesTab' as any))}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {continueLearning.map(c => renderContinueCard(c))}
          </ScrollView>
        </View>
      )}

      {/* ── Popular Courses (horizontal) ─────────────────────────────── */}
      {displayPopular.length > 0 && (
        <View style={styles.section}>
          {renderSectionHeader('🔥 Popular Courses')}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {displayPopular.map(c => renderHCard(c))}
          </ScrollView>
        </View>
      )}

      {/* ── Recommended — grid header text ───────────────────────────── */}
      <View style={[styles.section, { marginBottom: 4 }]}>
        {renderSectionHeader('⭐ Recommended Courses')}
      </View>
    </View>
  );

  /** Footer after the grid */
  const ListFooter = () => (
    <View style={{ paddingBottom: 16 }}>
      {/* ── New Courses (horizontal) ──────────────────────────────────── */}
      {displayNew.length > 0 && (
        <View style={[styles.section, { marginTop: Spacing.md }]}>
          {renderSectionHeader('✨ Recently Added')}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {displayNew.map(c => renderHCard(c))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <ScreenContainer edges={['left', 'right']}>
      <FlatList
        data={displayRecommended}
        numColumns={2}
        keyExtractor={(item, idx) => `${item._id}-${idx}`}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 16 }]}
        ListHeaderComponent={<ListHeader />}
        ListFooterComponent={<ListFooter />}
        renderItem={renderGridCard}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  list: { paddingHorizontal: Spacing.md },

  // ── Top Header
  topHeader: {
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md + 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: { flex: 1 },
  greeting: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: 2 },
  userName: { ...Typography.h3, color: Colors.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Shadows.sm,
  },
  iconBtnText: { fontSize: 20 },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    borderWidth: 2,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  avatarBtn: { borderRadius: 22, overflow: 'hidden', ...Shadows.sm },
  avatarGrad: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  // ── Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md + 2,
    height: 50,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchIcon: { fontSize: 17, marginRight: Spacing.sm, color: Colors.textMuted },
  searchPlaceholder: { flex: 1, color: Colors.textMuted, fontSize: 15 },

  // ── Banner
  bannerSection: { marginHorizontal: -Spacing.md, marginBottom: Spacing.md },
  bannerCard: {
    height: 196,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.lg,
  },
  bannerImage: { position: 'absolute', right: 0, width: '55%', height: '100%', opacity: 0.6 },
  bannerContent: { flex: 1, padding: Spacing.md + 2, justifyContent: 'flex-end' },
  bannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.secondary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    marginBottom: Spacing.sm,
  },
  bannerBadgeText: { ...Typography.overline, color: '#fff', letterSpacing: 0.5 },
  bannerTitle: { ...Typography.h4, color: '#fff', marginBottom: 4 },
  bannerSubtitle: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.88)', marginBottom: Spacing.sm },
  bannerCta: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  bannerCtaText: { ...Typography.buttonSm, color: '#fff' },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dotActive: { width: 22, backgroundColor: Colors.primary },

  // ── Sections
  section: { marginBottom: Spacing.md + 4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm + 2,
  },
  sectionTitle: { ...Typography.h5, color: Colors.text, fontWeight: '800' },
  seeAll: { ...Typography.bodySmall, color: Colors.primary, fontWeight: '700' },

  // ── Category Pills
  catPills: { gap: Spacing.sm, paddingRight: Spacing.md },
  catPill: { borderRadius: Radius.xl, overflow: 'hidden', ...Shadows.card },
  catPillGrad: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    minWidth: 88,
    gap: 4,
  },
  catPillIcon: { fontSize: 26 },
  catPillName: { ...Typography.caption, color: '#fff', fontWeight: '700', textAlign: 'center' },

  // ── Horizontal scroll
  hScroll: { gap: Spacing.md, paddingRight: Spacing.md },

  // ── Continue Learning card
  continueCard: {
    width: 300,
    height: 180,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.lg,
  },
  continueImage: { width: '100%', height: '100%', position: 'absolute' },
  continueImageGrad: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' },
  continueBody: { flex: 1, justifyContent: 'flex-end', padding: Spacing.md },
  continueTitle: { ...Typography.h6, color: '#fff', marginBottom: 6 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: Spacing.sm },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressPct: { ...Typography.caption, color: '#fff', fontWeight: '700', minWidth: 30 },
  resumeBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  resumeBtnText: { ...Typography.buttonSm, color: '#fff' },

  // ── Horizontal course card
  hCard: {
    width: 240,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  hCardImage: { width: '100%', height: 140 },
  discountBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.secondary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  discountText: { ...Typography.overline, color: '#fff', letterSpacing: 0.3 },
  hCardBody: { padding: Spacing.md },
  hCardTitle: { ...Typography.h6, color: Colors.text, marginBottom: 4 },
  hCardInstructor: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.xs },
  hCardFooter: { marginBottom: 4 },
  starRow: { flexDirection: 'row', alignItems: 'center' },
  starIcon: { color: Colors.star, fontSize: 13, marginRight: 3 },
  starText: { ...Typography.caption, color: Colors.text, fontWeight: '700' },
  enrolledText: { ...Typography.caption, color: Colors.textMuted },
  hCardPrice: { ...Typography.h5, color: Colors.primary, fontWeight: '800' },
  hCardOriginalPrice: { ...Typography.bodySmall, color: Colors.textMuted, textDecorationLine: 'line-through', fontSize: 12 },

  // ── Grid course card
  gridRow: { justifyContent: 'space-between', marginBottom: Spacing.md },
  gridCard: {
    width: (SW - Spacing.md * 3) / 2,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  gridImageWrap: { position: 'relative', width: '100%', height: 120 },
  gridImage: { width: '100%', height: '100%' },
  gridImageGrad: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },
  gridPriceBadge: {
    position: 'absolute',
    bottom: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  gridPriceText: { ...Typography.caption, color: '#fff', fontWeight: '800', fontSize: 11 },
  gridBody: { padding: Spacing.sm + 2 },
  gridTitle: { ...Typography.bodySmall, color: Colors.text, fontWeight: '700', marginBottom: 3, lineHeight: 18 },
  gridInstructor: { ...Typography.caption, color: Colors.textMuted, marginBottom: 4 },
  gridMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gridStar: { ...Typography.caption, color: Colors.star, fontWeight: '700' },
  levelChip: {
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  levelText: { ...Typography.caption, color: Colors.primary, fontWeight: '600', fontSize: 10 },
});
