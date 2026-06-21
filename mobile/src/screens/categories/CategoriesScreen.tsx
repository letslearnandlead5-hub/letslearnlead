import React from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { HomeStackParamList } from '../../types';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Categories'>;

const CATEGORIES = [
  // Subject-based categories
  { id: 'science', name: 'Science', icon: '🔬', gradient: ['#FF6B9D', '#FF8FB3'], courses: 45 },
  { id: 'math', name: 'Mathematics', icon: '📐', gradient: ['#4DA3FF', '#6DB5FF'], courses: 38 },
  { id: 'english', name: 'English', icon: '📚', gradient: ['#10B981', '#34D399'], courses: 52 },
  { id: 'kannada', name: 'Kannada', icon: '🗣️', gradient: ['#F59E0B', '#FBBF24'], courses: 28 },
  { id: 'social', name: 'Social Studies', icon: '🌍', gradient: ['#8B5CF6', '#A78BFA'], courses: 34 },
  { id: 'computer', name: 'Computer Science', icon: '💻', gradient: ['#06B6D4', '#22D3EE'], courses: 41 },
  { id: 'physics', name: 'Physics', icon: '⚛️', gradient: ['#EC4899', '#F472B6'], courses: 29 },
  { id: 'chemistry', name: 'Chemistry', icon: '🧪', gradient: ['#F97316', '#FB923C'], courses: 31 },
  { id: 'biology', name: 'Biology', icon: '🧬', gradient: ['#14B8A6', '#2DD4BF'], courses: 26 },
  { id: 'history', name: 'History', icon: '📜', gradient: ['#A855F7', '#C084FC'], courses: 22 },
];

export const CategoriesScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const handleCategoryPress = (category: typeof CATEGORIES[0]) => {
    navigation.navigate('CategoryCourses', {
      categoryId: category.id,
      categoryName: category.name,
    });
  };

  const renderCategoryCard = ({ item }: { item: typeof CATEGORIES[0] }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.85}>
      <LinearGradient
        colors={item.gradient as [string, string]}
        style={styles.categoryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={styles.categoryContent}>
          <Text style={styles.categoryIcon}>{item.icon}</Text>
          <Text style={styles.categoryName}>{item.name}</Text>
          <View style={styles.coursesCountBadge}>
            <Text style={styles.coursesCountText}>{item.courses} courses</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
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
        <Text style={styles.headerTitle}>All Categories</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Categories Grid */}
      <FlatList
        data={CATEGORIES}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={renderCategoryCard}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 80 }
        ]}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>Browse by Subject</Text>
        }
      />
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
  },
  placeholder: {
    width: 40,
  },
  list: {
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  categoryCard: {
    width: '48%',
    height: 180,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  categoryGradient: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  categoryContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  categoryIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  categoryName: {
    ...Typography.h5,
    color: Colors.textOnPrimary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  coursesCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
  },
  coursesCountText: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    fontWeight: '600',
    fontSize: 12,
  },
});
