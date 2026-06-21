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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { HomeStackParamList, Course, Enrollment } from '../../types';
import { useCourses } from '../../context/CourseContext';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services/courseService';
import { notificationService } from '../../services/notificationService';
import { bannerService, Banner } from '../../services/bannerService';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = 200;
const BANNER_INNER_WIDTH = SCREEN_WIDTH - 32; // visible card width with 16px padding each side
const CATEGORY_SIZE = 110;

const CATEGORIES = [
  { id: 'science', name: 'Science', icon: '🔬', color: '#FF6B9D', gradient: ['#FF6B9D', '#FF8FB3'] },
  { id: 'math', name: 'Math', icon: '📐', color: '#4DA3FF', gradient: ['#4DA3FF', '#6DB5FF'] },
  { id: 'english', name: 'English', icon: '📚', color: '#10B981', gradient: ['#10B981', '#34D399'] },
  { id: 'kannada', name: 'Kannada', icon: '🗣️', color: '#F59E0B', gradient: ['#F59E0B', '#FBBF24'] },
  { id: 'social', name: 'Social', icon: '🌍', color: '#8B5CF6', gradient: ['#8B5CF6', '#A78BFA'] },
];

const FEATURED_BANNERS = [
  {
    id: '1',
    title: 'Master Science',
    subtitle: 'Get 60% OFF on all courses',
    discount: '60% OFF',
    cta: 'Enroll Now',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400',
    bgGradient: ['#667eea', '#764ba2'],
    action: { type: 'category', id: 'science', name: 'Science' },
  },
  {
    id: '2',
    title: 'Learn Mathematics',
    subtitle: 'Limited time offer - 50% OFF',
    discount: '50% OFF',
    cta: 'Start Learning',
    image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
    bgGradient: ['#f093fb', '#f5576c'],
    action: { type: 'category', id: 'math', name: 'Mathematics' },
  },
  {
    id: '3',
    title: 'English Mastery',
    subtitle: 'Improve your skills today',
    discount: '40% OFF',
    cta: 'Join Now',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400',
    bgGradient: ['#4facfe', '#00f2fe'],
    action: { type: 'category', id: 'english', name: 'English' },
  },
  {
    id: '4',
    title: 'Kannada Classes',
    subtitle: 'Learn in your mother tongue',
    discount: 'FREE TRIAL',
    cta: 'Try Now',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400',
    bgGradient: ['#F59E0B', '#FBBF24'],
    action: { type: 'category', id: 'kannada', name: 'Kannada' },
  },
  {
    id: '5',
    title: 'Social Studies',
    subtitle: 'Explore history and geography',
    discount: '30% OFF',
    cta: 'Explore',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
    bgGradient: ['#8B5CF6', '#A78BFA'],
    action: { type: 'category', id: 'social', name: 'Social Studies' },
  },
];

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { courses, isLoading, error, fetchCourses, refreshCourses } = useCourses();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const bannerScrollRef = useRef<ScrollView>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [continueLearning, setContinueLearning] = useState<any[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const bannerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeBannerIndexRef = useRef(0);

  useEffect(() => {
    fetchCourses();
    loadContinueLearning();
    loadNotificationCount();
    loadBanners();
  }, []);

  const loadNotificationCount = async () => {
    try {
      const response = await notificationService.getNotifications(1, true);
      if (response.success) {
        setUnreadNotificationCount(response.unreadCount || 0);
      }
    } catch (err) {
      console.log('Failed to load notification count');
    }
  };

  const loadBanners = async () => {
    try {
      const response = await bannerService.getActiveBanners();
      if (response.success && response.data) {
        setBanners(response.data);
      }
    } catch (err) {
      console.log('Failed to load banners, using default banners');
      // Fallback to hardcoded banners if API fails
      setBanners(FEATURED_BANNERS as any);
    }
  };

  // Auto-scroll banner every 3 seconds
  useEffect(() => {
    if (banners.length > 0) {
      startBannerAutoScroll();
    }
    return () => stopBannerAutoScroll();
  }, [banners.length]); // restart when banners change

  const startBannerAutoScroll = useCallback(() => {
    stopBannerAutoScroll();
    bannerIntervalRef.current = setInterval(() => {
      const nextIndex = (activeBannerIndexRef.current + 1) % banners.length;
      scrollToBanner(nextIndex);
    }, 3000);
  }, [banners.length]);

  const stopBannerAutoScroll = useCallback(() => {
    if (bannerIntervalRef.current) {
      clearInterval(bannerIntervalRef.current);
      bannerIntervalRef.current = null;
    }
  }, []);

  const scrollToBanner = (index: number) => {
    if (bannerScrollRef.current) {
      // ScrollView scrollTo is exact — no FlatList offset calculation issues
      bannerScrollRef.current.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
      activeBannerIndexRef.current = index;
      setActiveBannerIndex(index);
    }
  };

  const handleBannerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    
    if (index !== activeBannerIndexRef.current && index >= 0 && index < banners.length) {
      activeBannerIndexRef.current = index;
      setActiveBannerIndex(index);
    }
  };

  useEffect(() => {
    fetchCourses();
    loadContinueLearning();
  }, []);

  const loadContinueLearning = async () => {
    try {
      const response = await courseService.getEnrolledCourses();
      if (response.success && response.data) {
        setContinueLearning(response.data.slice(0, 3));
      }
    } catch (err) {
      console.log('Failed to load enrolled courses');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCourses();
    await loadContinueLearning();
    await loadNotificationCount();
    await loadBanners();
    setRefreshing(false);
  }, [refreshCourses]);

  const handleCoursePress = (course: Course) => {
    navigation.navigate('CourseDetail', {
      courseId: course._id,
      courseTitle: course.title,
    });
  };

  const handleBannerPress = (banner: Banner) => {
    if (banner.actionType === 'category') {
      // Navigate to category courses page
      navigation.navigate('CategoryCourses', {
        categoryId: banner.actionId || '',
        categoryName: banner.actionName || '',
      });
    } else if (banner.actionType === 'course') {
      // Navigate to specific course detail page
      navigation.navigate('CourseDetail', {
        courseId: banner.actionId || '',
        courseTitle: banner.actionName || '',
      });
    } else if (banner.actionType === 'search') {
      // Navigate to search with pre-filled query
      navigation.navigate('Search', {
        initialQuery: banner.actionQuery || '',
      });
    }
  };

  // Separate courses by category
  // ⭐ Recommended: High-rated courses (4.5+ stars)
  const recommendedCourses = courses
    .filter(c => c.rating >= 4.5)
    .sort((a, b) => b.rating - a.rating) // Sort by rating (highest first)
    .slice(0, 10);
  
  // 🔥 Popular: Most enrolled courses (50+ students)
  const popularCourses = courses
    .filter(c => c.studentsEnrolled >= 50)
    .sort((a, b) => b.studentsEnrolled - a.studentsEnrolled) // Sort by enrollment
    .slice(0, 10);
  
  // ✨ New: Latest courses
  const newCourses = courses
    .slice(0, 10)
    .reverse(); // Newest first
  
  // Fallback: If not enough courses, show all available courses
  const displayRecommended = recommendedCourses.length > 0 ? recommendedCourses : courses.slice(0, 10);
  const displayPopular = popularCourses.length > 0 ? popularCourses : courses.slice(0, 10);
  const displayNew = newCourses.length > 0 ? newCourses : courses.slice(0, 10);

  const renderHeader = () => (
    <View>
      {/* Header with Profile */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Learner'} 👋</Text>
          <Text style={styles.subGreeting}>What will you learn today?</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.notificationBtn}
            onPress={() => {
              navigation.navigate('Notifications');
              // Reset count when opening notifications
              setUnreadNotificationCount(0);
            }}>
            <Text style={styles.notificationIcon}>🔔</Text>
            {unreadNotificationCount > 0 && (
              <View style={styles.notificationBadge}>
                {unreadNotificationCount <= 9 ? (
                  <Text style={styles.notificationBadgeText}>{unreadNotificationCount}</Text>
                ) : (
                  <Text style={styles.notificationBadgeText}>9+</Text>
                )}
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.avatar}
            onPress={() => navigation.navigate('ProfileTab' as any)}>
            <Text style={styles.avatarText}>
              {(user?.name?.[0] || 'L').toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Search', {})}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search courses, subjects...</Text>
        </TouchableOpacity>
      </View>

      {/* Featured Banner Carousel — ScrollView is used instead of FlatList
           because FlatList inside ListHeaderComponent cannot reliably determine
           its frame width for pagingEnabled / scrollToIndex */}
      {banners.length > 0 && (
        <View style={styles.bannerContainer}>
          <ScrollView
            ref={bannerScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            decelerationRate="fast"
            bounces={false}
            onMomentumScrollEnd={handleBannerScroll}
            onScrollBeginDrag={stopBannerAutoScroll}
            onScrollEndDrag={startBannerAutoScroll}>
            {banners.map((item) => (
              <View key={item._id} style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => handleBannerPress(item)}>
                  <LinearGradient
                    colors={item.bgGradient as [string, string]}
                    style={styles.banner}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}>
                    <View style={styles.bannerContent}>
                      <Text style={styles.bannerTitle}>{item.title}</Text>
                      <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                      <TouchableOpacity
                        style={styles.bannerButton}
                        onPress={() => handleBannerPress(item)}>
                        <Text style={styles.bannerButtonText}>{item.cta} →</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.bannerBadge}>
                      <Text style={styles.bannerBadgeText}>{item.discount}</Text>
                    </View>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.bannerImage}
                      resizeMode="cover"
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          
          {/* Pagination Dots */}
          <View style={styles.paginationDots}>
            {banners.map((_, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                onPress={() => scrollToBanner(index)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <View
                  style={[
                    styles.dot,
                    index === activeBannerIndex && styles.activeDot,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📚 Categories</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
            <Text style={styles.seeAll}>See All →</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.categoryCard}
              onPress={() => navigation.navigate('CategoryCourses', {
                categoryId: item.id,
                categoryName: item.name,
              })}>
              <LinearGradient
                colors={item.gradient as [string, string]}
                style={styles.categoryIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}>
                <Text style={styles.categoryEmoji}>{item.icon}</Text>
              </LinearGradient>
              <Text style={styles.categoryName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Continue Learning */}
      {continueLearning.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎯 Continue Learning</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyCoursesTab' as any)}>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={continueLearning}
            keyExtractor={(item) => item._id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.coursesList}
            renderItem={({ item }) => renderContinueCourseCard(item)}
          />
        </View>
      )}

      {/* Recommended Courses */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⭐ Recommended Courses</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderContinueCourseCard = (course: any) => {
    // Use actual completion percentage from backend, default to 0 if not available
    const progress = course.completionPercentage || 0;
    const actualCourse = typeof course.courseId === 'object' ? course.courseId : course;
    
    return (
      <TouchableOpacity
        style={styles.continueCourseCard}
        onPress={() => handleCoursePress(actualCourse)}>
        <Image
          source={{ uri: actualCourse.thumbnail || 'https://via.placeholder.com/300x180' }}
          style={styles.continueCourseImage}
          resizeMode="cover"
        />
        <View style={styles.continueCourseInfo}>
          <Text style={styles.continueCourseTitle} numberOfLines={2}>
            {actualCourse.title}
          </Text>
          <Text style={styles.continueCourseLesson} numberOfLines={1}>
            {actualCourse.instructor}
          </Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={['#0D7EFF', '#4DA3FF']}
                style={[styles.progressFill, { width: `${progress}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
          <TouchableOpacity 
            style={styles.resumeButton}
            onPress={() => handleCoursePress(actualCourse)}>
            <Text style={styles.resumeButtonText}>Resume →</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHorizontalCourseCard = (course: Course) => (
    <TouchableOpacity
      style={styles.horizontalCourseCard}
      onPress={() => handleCoursePress(course)}>
      <Image
        source={{ uri: course.thumbnail || 'https://via.placeholder.com/300x180' }}
        style={styles.horizontalCourseImage}
        resizeMode="cover"
      />
      {course.originalPrice && course.originalPrice > course.price && (
        <View style={styles.trendingBadge}>
          <Text style={styles.trendingText}>🔥 Trending</Text>
        </View>
      )}
      <View style={styles.horizontalCourseInfo}>
        <Text style={styles.horizontalCourseTitle} numberOfLines={2}>
          {course.title}
        </Text>
        <Text style={styles.horizontalCourseInstructor} numberOfLines={1}>
          👨‍🏫 {course.instructor}
        </Text>
        <View style={styles.horizontalCourseMeta}>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingStar}>⭐</Text>
            <Text style={styles.ratingText}>{course.rating}</Text>
          </View>
          <Text style={styles.courseMeta}>👥 {course.studentsEnrolled}</Text>
        </View>
        <View style={styles.horizontalCourseFooter}>
          <Text style={styles.horizontalCoursePrice}>₹{course.price}</Text>
          {course.originalPrice && course.originalPrice > course.price && (
            <Text style={styles.horizontalCourseOriginalPrice}>₹{course.originalPrice}</Text>
          )}
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{course.level}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCourseCard = (course: Course) => (
    <TouchableOpacity
      style={styles.courseCard}
      onPress={() => handleCoursePress(course)}>
      <View style={styles.courseImageContainer}>
        <Image
          source={{ uri: course.thumbnail || 'https://via.placeholder.com/300x180'}}
          style={styles.courseImage}
          resizeMode="cover"
        />
        <View style={styles.courseBadge}>
          <Text style={styles.courseBadgeText}>₹{course.price}</Text>
        </View>
        {course.originalPrice && course.originalPrice > course.price && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}% OFF
            </Text>
          </View>
        )}
      </View>
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {course.title}
        </Text>
        <Text style={styles.courseInstructor} numberOfLines={1}>
          {course.instructor}
        </Text>
        <View style={styles.courseFooter}>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingStar}>⭐</Text>
            <Text style={styles.ratingText}>{course.rating}</Text>
          </View>
          <View style={styles.courseMetaContainer}>
            <Text style={styles.courseMeta}>👥 {course.studentsEnrolled}</Text>
            <Text style={styles.courseMeta}>⏱ {course.duration}</Text>
          </View>
        </View>
        <View style={styles.courseTags}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{course.level}</Text>
          </View>
          {course.medium && (
            <View style={styles.mediumBadge}>
              <Text style={styles.mediumText}>{course.medium}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <FlatList
        data={displayRecommended}
        numColumns={2}
        keyExtractor={(item, index) => `${item._id}-${index}`}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        ListHeaderComponent={renderHeader()}
        ListFooterComponent={
          <>
            {/* Popular Courses */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🔥 Popular Courses</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAll}>See All →</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={displayPopular}
                horizontal
                keyExtractor={(item) => item._id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.coursesList}
                renderItem={({ item }) => renderHorizontalCourseCard(item)}
              />
            </View>

            {/* New Courses */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>✨ New Courses</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAll}>See All →</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={displayNew}
                horizontal
                keyExtractor={(item) => item._id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.coursesList}
                renderItem={({ item }) => renderHorizontalCourseCard(item)}
              />
            </View>
          </>
        }
        renderItem={({ item }) => renderCourseCard(item)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { paddingHorizontal: Spacing.md },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm + 4,
  },
  headerLeft: { flex: 1 },
  greeting: { ...Typography.h3, color: Colors.text, marginBottom: 4 },
  subGreeting: { ...Typography.body, color: Colors.textSecondary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
    position: 'relative',
  },
  notificationIcon: { fontSize: 20 },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    borderWidth: 2,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: Colors.textOnPrimary,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.textOnPrimary, fontSize: 18, fontWeight: '700' },

  // Search
  searchContainer: { marginBottom: Spacing.md + 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md + 2,
    height: 50,
    ...Shadows.md,
  },
  searchIcon: { fontSize: 18, marginRight: Spacing.sm },
  searchPlaceholder: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: 15,
  },

  // Banner
  bannerContainer: { marginBottom: Spacing.md + 4, marginHorizontal: -Spacing.md },
  banner: {
    width: BANNER_INNER_WIDTH,
    height: 180,
    borderRadius: Radius.lg + 2,
    padding: Spacing.md + 2,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  bannerContent: { flex: 1, justifyContent: 'center', zIndex: 2 },
  bannerTitle: { ...Typography.h3, color: Colors.textOnPrimary, marginBottom: 4, fontWeight: '700' },
  bannerSubtitle: { ...Typography.body, color: 'rgba(255,255,255,0.9)', marginBottom: Spacing.md },
  bannerButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
    ...Shadows.md,
  },
  bannerButtonText: { ...Typography.button, color: Colors.primary, fontWeight: '700' },
  bannerBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  bannerBadgeText: { ...Typography.caption, color: Colors.textOnPrimary, fontWeight: '800', fontSize: 13 },
  bannerImage: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 140,
    height: 140,
    borderTopLeftRadius: Radius.xl,
    opacity: 0.3,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.divider,
  },
  activeDot: {
    width: 24,
    backgroundColor: Colors.primary,
  },

  // Section
  section: { marginBottom: Spacing.md + 4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm + 2,
    paddingHorizontal: 2,
  },
  sectionTitle: { ...Typography.h5, color: Colors.text, fontWeight: '800', fontSize: 17 },
  seeAll: { ...Typography.bodySmall, color: Colors.primary, fontWeight: '700', fontSize: 13 },

  // Categories
  categoriesList: { gap: Spacing.md },
  categoryCard: {
    alignItems: 'center',
    width: CATEGORY_SIZE,
  },
  categoryIcon: {
    width: 88,
    height: 88,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  categoryEmoji: { fontSize: 40 },
  categoryName: { ...Typography.caption, color: Colors.text, fontWeight: '700', textAlign: 'center', fontSize: 13 },

  // Continue Learning Card
  coursesList: { gap: Spacing.md, paddingRight: Spacing.md },
  continueCourseCard: {
    width: SCREEN_WIDTH * 0.75,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  continueCourseImage: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.divider,
  },
  continueCourseInfo: { padding: Spacing.md },
  continueCourseTitle: { ...Typography.h5, color: Colors.text, marginBottom: 4, fontWeight: '700' },
  continueCourseLesson: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.md },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.progressBackground,
    borderRadius: 4,
    marginRight: Spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: { ...Typography.caption, color: Colors.primary, fontWeight: '700', minWidth: 40, fontSize: 13 },
  resumeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  resumeButtonText: { ...Typography.button, color: Colors.textOnPrimary, fontSize: 15, fontWeight: '700' },

  // Course Card
  row: { justifyContent: 'space-between', marginBottom: Spacing.md },
  
  // Horizontal Course Card (for Popular & New sections)
  horizontalCourseCard: {
    width: SCREEN_WIDTH * 0.7,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  horizontalCourseImage: {
    width: '100%',
    height: 160,
  },
  trendingBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    ...Shadows.sm,
  },
  trendingText: { ...Typography.caption, color: Colors.textOnPrimary, fontWeight: '700', fontSize: 11 },
  horizontalCourseInfo: { padding: Spacing.md },
  horizontalCourseTitle: { ...Typography.h5, color: Colors.text, fontWeight: '700', marginBottom: 4, fontSize: 15 },
  horizontalCourseInstructor: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.sm },
  horizontalCourseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  horizontalCourseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  horizontalCoursePrice: { ...Typography.h5, color: Colors.primary, fontWeight: '700', fontSize: 18 },
  horizontalCourseOriginalPrice: {
    ...Typography.caption,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
    fontSize: 13,
  },
  
  // Grid Course Card (for Recommended section)
  courseCard: {
    width: (SCREEN_WIDTH - Spacing.md * 3) / 2,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  courseImageContainer: {
    width: '100%',
    height: 130,
    position: 'relative',
  },
  courseImage: {
    width: '100%',
    height: '100%',
  },
  courseBadge: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    ...Shadows.sm,
  },
  courseBadgeText: { ...Typography.caption, color: Colors.textOnPrimary, fontWeight: '800', fontSize: 12 },
  discountBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    ...Shadows.sm,
  },
  discountText: { ...Typography.caption, color: '#FFF', fontWeight: '800', fontSize: 11 },
  courseInfo: { padding: Spacing.md },
  courseTitle: { ...Typography.body, color: Colors.text, fontWeight: '700', marginBottom: 4, fontSize: 14 },
  courseInstructor: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.xs },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  ratingContainer: { flexDirection: 'row', alignItems: 'center' },
  ratingStar: { fontSize: 12, marginRight: 2 },
  ratingText: { ...Typography.caption, color: Colors.text, fontWeight: '600' },
  courseMetaContainer: { flexDirection: 'row', gap: 6 },
  courseMeta: { ...Typography.caption, color: Colors.textMuted, fontSize: 10 },
  courseTags: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  levelBadge: {
    backgroundColor: Colors.progressBackground,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  levelText: { ...Typography.caption, color: Colors.primary, fontSize: 10, fontWeight: '700' },
  mediumBadge: {
    backgroundColor: Colors.divider,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mediumText: { ...Typography.caption, color: Colors.textSecondary, fontSize: 10, fontWeight: '600' },
});
