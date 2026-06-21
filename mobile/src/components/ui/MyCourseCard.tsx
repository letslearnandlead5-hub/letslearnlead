import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Course } from '../../types';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - Spacing.md * 2;

interface MyCourseCardProps {
  course: Course & { completionPercentage?: number; completedLessons?: number; totalLessons?: number };
  onPress: (course: Course) => void;
}

export const MyCourseCard: React.FC<MyCourseCardProps> = ({ course, onPress }) => {
  const progress = course.completionPercentage || 0;
  const completed = course.completedLessons || 0;
  const total = course.totalLessons || 10;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(course)}
      activeOpacity={0.95}>
      {/* Course Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: course.thumbnail || 'https://via.placeholder.com/400x200/4F46E5/FFFFFF?text=Course',
          }}
          style={styles.image}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)']}
          style={styles.imageGradient}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {course.title}
        </Text>

        {/* Instructor */}
        <Text style={styles.instructor} numberOfLines={1}>
          {course.instructor}
        </Text>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>

          {/* Lessons Completed */}
          <Text style={styles.lessonsText}>
            {completed}/{total} lessons completed
          </Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => onPress(course)}
          activeOpacity={0.8}>
          <LinearGradient
            colors={['#4F46E5', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}>
            <Text style={styles.buttonText}>▶ Continue Learning</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  imageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 4,
  },
  instructor: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  progressSection: {
    marginBottom: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E8E9F3',
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: Radius.full,
  },
  lessonsText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  continueButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
