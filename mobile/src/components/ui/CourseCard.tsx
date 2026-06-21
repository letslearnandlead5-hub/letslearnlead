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
import { Badge } from './Badge';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.md * 3) / 2;

interface CourseCardProps {
  course: Course;
  onPress: (course: Course) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onPress }) => {
  const isFree = course.price === 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(course)}
      activeOpacity={0.92}>
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        <Image
          source={{
            uri: course.thumbnail || 'https://via.placeholder.com/300x180/1A1A2E/6C63FF?text=Course',
          }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)']}
          style={styles.thumbnailGradient}
        />
        {/* Price badge */}
        <View style={styles.priceBadge}>
          {isFree ? (
            <Badge label="FREE" variant="free" />
          ) : (
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>₹{course.price}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {course.title}
        </Text>

        <Text style={styles.instructor} numberOfLines={1}>
          👨‍🏫 {course.instructor}
        </Text>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <Badge label={course.level} variant="level" />
          {course.medium && (
            <Badge label={course.medium} variant="medium" style={styles.badgeGap} />
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <Text style={styles.stat}>⭐ {course.rating?.toFixed(1) || '4.5'}</Text>
          <Text style={styles.stat}>👥 {course.studentsEnrolled || 0}</Text>
          {course.duration && (
            <Text style={styles.stat}>⏱ {course.duration}</Text>
          )}
        </View>

        {/* Original price */}
        {!isFree && course.originalPrice && course.originalPrice > course.price && (
          <View style={styles.discountRow}>
            <Text style={styles.originalPrice}>₹{course.originalPrice}</Text>
            <Text style={styles.discount}>
              {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}% OFF
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  thumbnailContainer: {
    width: '100%',
    height: 110,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  priceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  priceTag: {
    backgroundColor: Colors.primary,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  priceText: {
    color: Colors.textOnPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    padding: Spacing.sm,
    gap: 4,
  },
  title: {
    ...Typography.h5,
    color: Colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  instructor: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  badgeGap: {
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  stat: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  originalPrice: {
    fontSize: 11,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  discount: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: '700',
  },
});
