import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { HomeStackParamList, Course } from '../../types';
import { courseService } from '../../services/courseService';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Search'>;

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '📚' },
  { id: 'science', name: 'Science', icon: '🔬' },
  { id: 'math', name: 'Math', icon: '📐' },
  { id: 'english', name: 'English', icon: '📖' },
  { id: 'kannada', name: 'Kannada', icon: '🗣️' },
  { id: 'social', name: 'Social', icon: '🌍' },
];

const GRADES = [
  { id: 'all', name: 'All Grades' },
  { id: '6th', name: '6th' },
  { id: '7th', name: '7th' },
  { id: '8th', name: '8th' },
  { id: '9th', name: '9th' },
  { id: '10th', name: '10th' },
];

const MEDIUMS = [
  { id: 'all', name: 'All' },
  { id: 'english', name: 'English' },
  { id: 'kannada', name: 'Kannada' },
];

export const SearchScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const searchInputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [searchQuery, setSearchQuery] = useState(route.params?.initialQuery || '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedMedium, setSelectedMedium] = useState('all');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    // Auto-focus search input
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);

    // If initial query provided, search immediately
    if (route.params?.initialQuery) {
      performSearch(route.params.initialQuery);
    }
  }, []);

  const performSearch = async (query: string = searchQuery) => {
    try {
      setLoading(true);
      setHasSearched(true);

      const filters: any = {};
      
      // Only add search query if it's not empty
      // If empty, just use filters
      if (query.trim().length > 0) {
        filters.search = query.trim();
      }
      
      if (selectedCategory !== 'all') filters.category = selectedCategory;
      if (selectedGrade !== 'all') filters.grade = selectedGrade;
      if (selectedMedium !== 'all') filters.medium = selectedMedium;

      const response = await courseService.getCourses(filters);
      if (response.success && response.data) {
        setCourses(response.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounced search - search even with empty text if filters are selected
    if (text.trim().length >= 2 || text.trim().length === 0) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(text);
      }, 500);
    }
  }, [selectedCategory, selectedGrade, selectedMedium]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setCourses([]);
    setHasSearched(false);
    searchInputRef.current?.focus();
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Auto-search when filter changes
    setTimeout(() => performSearch(), 100);
  };

  const handleGradeSelect = (gradeId: string) => {
    setSelectedGrade(gradeId);
    // Auto-search when filter changes
    setTimeout(() => performSearch(), 100);
  };

  const handleMediumSelect = (mediumId: string) => {
    setSelectedMedium(mediumId);
    // Auto-search when filter changes
    setTimeout(() => performSearch(), 100);
  };

  const handleCoursePress = (course: Course) => {
    navigation.navigate('CourseDetail', {
      courseId: course._id,
      courseTitle: course.title,
    });
  };

  const renderCourseCard = ({ item }: { item: Course }) => (
    <TouchableOpacity
      style={styles.courseCard}
      onPress={() => handleCoursePress(item)}
      activeOpacity={0.7}>
      <Image
        source={{ uri: item.thumbnail || 'https://via.placeholder.com/300x180' }}
        style={styles.courseImage}
        resizeMode="cover"
      />
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.courseInstructor} numberOfLines={1}>
          👨‍🏫 {item.instructor}
        </Text>
        <View style={styles.courseFooter}>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingStar}>⭐</Text>
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
          <Text style={styles.courseMeta}>👥 {item.studentsEnrolled}</Text>
          <Text style={styles.coursePrice}>₹{item.price}</Text>
        </View>
        <View style={styles.courseTags}>
          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}
          {item.medium && (
            <View style={styles.mediumBadge}>
              <Text style={styles.mediumText}>{item.medium}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (loading) return null;

    if (!hasSearched) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>Search for Courses</Text>
          <Text style={styles.emptyMessage}>
            Type to search or select filters below{'\n'}to find courses
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>😕</Text>
        <Text style={styles.emptyTitle}>No courses found</Text>
        <Text style={styles.emptyMessage}>
          Try different keywords or adjust filters
        </Text>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            setSearchQuery('');
            setSelectedCategory('all');
            setSelectedGrade('all');
            setSelectedMedium('all');
            setCourses([]);
            setHasSearched(false);
          }}>
          <Text style={styles.resetButtonText}>Reset All</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.searchBarContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search courses, subjects..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={() => performSearch()}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* Categories */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Category</Text>
          <FlatList
            horizontal
            data={CATEGORIES}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedCategory === item.id && styles.filterChipActive,
                ]}
                onPress={() => handleCategorySelect(item.id)}>
                <Text style={styles.filterChipIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategory === item.id && styles.filterChipTextActive,
                  ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Grade & Medium */}
        <View style={styles.filterRow}>
          <View style={styles.filterColumn}>
            <Text style={styles.filterLabel}>Grade</Text>
            <FlatList
              horizontal
              data={GRADES}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.filterChipSmall,
                    selectedGrade === item.id && styles.filterChipActive,
                  ]}
                  onPress={() => handleGradeSelect(item.id)}>
                  <Text
                    style={[
                      styles.filterChipTextSmall,
                      selectedGrade === item.id && styles.filterChipTextActive,
                    ]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          <View style={styles.filterColumn}>
            <Text style={styles.filterLabel}>Medium</Text>
            <FlatList
              horizontal
              data={MEDIUMS}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.filterChipSmall,
                    selectedMedium === item.id && styles.filterChipActive,
                  ]}
                  onPress={() => handleMediumSelect(item.id)}>
                  <Text
                    style={[
                      styles.filterChipTextSmall,
                      selectedMedium === item.id && styles.filterChipTextActive,
                    ]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item._id}
          renderItem={renderCourseCard}
          contentContainerStyle={[
            styles.resultsList,
            { paddingBottom: insets.bottom + 16 },
          ]}
          ListEmptyComponent={renderEmptyState}
          ListHeaderComponent={
            courses.length > 0 ? (
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>
                  {courses.length} {courses.length === 1 ? 'course' : 'courses'} found
                </Text>
                {searchQuery.trim().length > 0 && (
                  <Text style={styles.searchInfo}>
                    Searching in title, category, description & instructor
                  </Text>
                )}
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  backIcon: {
    fontSize: 24,
    color: Colors.text,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    ...Shadows.md,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearIcon: {
    fontSize: 16,
    color: Colors.textMuted,
    paddingLeft: Spacing.sm,
  },
  filtersContainer: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  filterSection: {
    marginBottom: Spacing.sm,
  },
  filterLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  filterList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipIcon: {
    fontSize: 16,
  },
  filterChipText: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: Colors.textOnPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  filterColumn: {
    flex: 1,
  },
  filterChipSmall: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  filterChipTextSmall: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  resultsList: {
    padding: Spacing.md,
  },
  resultsHeader: {
    marginBottom: Spacing.md,
  },
  resultsCount: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  searchInfo: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  courseCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.md,
  },
  courseImage: {
    width: 120,
    height: 120,
  },
  courseInfo: {
    flex: 1,
    padding: Spacing.md,
  },
  courseTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  courseInstructor: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  courseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStar: {
    fontSize: 12,
    marginRight: 2,
  },
  ratingText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
  },
  courseMeta: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 11,
  },
  coursePrice: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  courseTags: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: Colors.progressBackground,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  categoryText: {
    ...Typography.caption,
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  mediumBadge: {
    backgroundColor: Colors.divider,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mediumText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyMessage: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  resetButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  resetButtonText: {
    ...Typography.button,
    color: Colors.textOnPrimary,
    fontWeight: '700',
  },
});
