import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeStackParamList, Course } from '../../types';
import { courseService } from '../../services/courseService';
import { FilterChip } from '../../components/ui/FilterChip';
import { CourseCard } from '../../components/ui/CourseCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'CategoryCourses'>;

const GRADES = ['All', '6th', '7th', '8th', '9th', '10th'];
const MEDIUMS = ['All', 'English', 'Kannada'];

export const CategoryCoursesScreen: React.FC<Props> = ({ route, navigation }) => {
  const { categoryId, categoryName } = route.params;
  const insets = useSafeAreaInsets();

  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedMedium, setSelectedMedium] = useState('All');

  useEffect(() => {
    loadCourses();
  }, [categoryId, selectedGrade, selectedMedium]);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const filters: any = { category: categoryId };
      
      if (selectedGrade !== 'All') {
        filters.grade = selectedGrade;
      }
      
      if (selectedMedium !== 'All') {
        filters.medium = selectedMedium.toLowerCase();
      }

      const response = await courseService.getCourses(filters);
      setCourses(response.data || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoursePress = (course: Course) => {
    navigation.navigate('CourseDetail', {
      courseId: course._id,
      courseTitle: course.title,
    });
  };

  const renderHeader = () => (
    <View>
      {/* Grade Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Grade / Standard</Text>
        <FlatList
          horizontal
          data={GRADES}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <FilterChip
              label={item === 'All' ? 'All Grades' : `${item} Std`}
              selected={selectedGrade === item}
              onPress={() => setSelectedGrade(item)}
            />
          )}
        />
      </View>

      {/* Medium Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Medium</Text>
        <FlatList
          horizontal
          data={MEDIUMS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <FilterChip
              label={item}
              selected={selectedMedium === item}
              onPress={() => setSelectedMedium(item)}
            />
          )}
        />
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {courses.length} {courses.length === 1 ? 'course' : 'courses'} found
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📚</Text>
      <Text style={styles.emptyText}>No courses found</Text>
      <Text style={styles.emptySubtext}>
        {selectedGrade !== 'All' || selectedMedium !== 'All'
          ? 'Try removing the filters — no matching courses for your selection.'
          : 'No courses are available in this category yet. Check back soon!'}
      </Text>
    </View>
  );

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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {categoryName}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen message="Loading courses..." />
      ) : (
        <FlatList
          data={courses}
          numColumns={2}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          columnWrapperStyle={courses.length > 0 ? styles.row : undefined}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 80 }
          ]}
          renderItem={({ item }) => (
            <CourseCard course={item} onPress={handleCoursePress} />
          )}
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
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
  headerTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  placeholder: {
    width: 40,
  },
  list: {
    paddingHorizontal: Spacing.md,
  },
  filterSection: {
    marginBottom: Spacing.lg,
  },
  filterLabel: {
    ...Typography.h5,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  filterList: {
    gap: Spacing.sm,
  },
  resultsHeader: {
    marginBottom: Spacing.md,
  },
  resultsText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: Spacing.sm,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyText: {
    ...Typography.h5,
    color: Colors.textSecondary,
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
