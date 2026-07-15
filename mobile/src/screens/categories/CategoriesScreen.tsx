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

// These IDs MUST match the `category` field values stored in MongoDB courses
// (set by admin in CourseEditor → Category dropdown)
const CATEGORIES = [
  // School
  {
    id: 'school-6-10',
    name: 'School (Class 6–10)',
    icon: '🏫',
    gradient: ['#4DA3FF', '#6DB5FF'] as [string, string],
    description: 'CBSE / State Board curriculum',
  },
  {
    id: 'school-puc',
    name: 'PUC (Class 11–12)',
    icon: '🎓',
    gradient: ['#10B981', '#34D399'] as [string, string],
    description: 'Science, Commerce & Arts streams',
  },
  // Competitive
  {
    id: 'neet',
    name: 'NEET Preparation',
    icon: '🩺',
    gradient: ['#FF6B9D', '#FF8FB3'] as [string, string],
    description: 'Medical entrance exam prep',
  },
  {
    id: 'jee',
    name: 'JEE Preparation',
    icon: '⚙️',
    gradient: ['#F97316', '#FB923C'] as [string, string],
    description: 'Engineering entrance exam prep',
  },
  {
    id: 'kcet',
    name: 'KCET Preparation',
    icon: '📋',
    gradient: ['#8B5CF6', '#A78BFA'] as [string, string],
    description: 'Karnataka common entrance test',
  },
  {
    id: 'upsc',
    name: 'UPSC / Govt Exams',
    icon: '🏛️',
    gradient: ['#EC4899', '#F472B6'] as [string, string],
    description: 'Civil services & government exams',
  },
  {
    id: 'competitive',
    name: 'Other Competitive',
    icon: '📝',
    gradient: ['#F59E0B', '#FBBF24'] as [string, string],
    description: 'Bank, SSC, Railways & more',
  },
  // Higher Education
  {
    id: 'college',
    name: 'College / Degree',
    icon: '🎯',
    gradient: ['#06B6D4', '#22D3EE'] as [string, string],
    description: 'Undergraduate college courses',
  },
  {
    id: 'skills',
    name: 'Skills & Certification',
    icon: '💼',
    gradient: ['#14B8A6', '#2DD4BF'] as [string, string],
    description: 'Professional skills & certifications',
  },
  {
    id: 'other',
    name: 'Other',
    icon: '📦',
    gradient: ['#A855F7', '#C084FC'] as [string, string],
    description: 'More learning opportunities',
  },
];

export const CategoriesScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const handleCategoryPress = (category: (typeof CATEGORIES)[0]) => {
    navigation.navigate('CategoryCourses', {
      categoryId: category.id,
      categoryName: category.name,
    });
  };

  const renderCategoryCard = ({ item }: { item: (typeof CATEGORIES)[0] }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.85}>
      <LinearGradient
        colors={item.gradient}
        style={styles.categoryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={styles.categoryContent}>
          <Text style={styles.categoryIcon}>{item.icon}</Text>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.categoryDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.exploreBadge}>
            <Text style={styles.exploreText}>Explore →</Text>
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

      {/* Subtitle */}
      <Text style={styles.subtitle}>Find the right course for you</Text>

      {/* Categories Grid */}
      <FlatList
        data={CATEGORIES}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={renderCategoryCard}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 80 },
        ]}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
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
    paddingBottom: Spacing.sm,
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
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  list: {
    padding: Spacing.md,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  categoryCard: {
    width: '48%',
    height: 190,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  categoryGradient: {
    flex: 1,
    padding: Spacing.md,
  },
  categoryContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  categoryIcon: {
    fontSize: 44,
    marginBottom: Spacing.xs,
  },
  categoryName: {
    ...Typography.h5,
    color: Colors.textOnPrimary,
    fontWeight: '700',
    marginBottom: 4,
    fontSize: 14,
    lineHeight: 20,
  },
  categoryDescription: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 15,
    marginBottom: Spacing.xs,
  },
  exploreBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
  },
  exploreText: {
    fontSize: 11,
    color: Colors.textOnPrimary,
    fontWeight: '700',
  },
});
