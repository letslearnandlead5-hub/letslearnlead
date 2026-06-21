import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme';

interface Lesson {
  _id: string;
  title: string;
  type: 'video' | 'document' | 'quiz';
  duration?: string;
  videoUrl?: string;
}

interface CurriculumLessonProps {
  lesson: Lesson;
  index: number;
  isEnrolled: boolean;
  onPress: () => void;
}

export const CurriculumLesson: React.FC<CurriculumLessonProps> = ({
  lesson,
  index,
  isEnrolled,
  onPress,
}) => {
  const getIcon = () => {
    switch (lesson.type) {
      case 'video':
        return '▶️';
      case 'quiz':
        return '📝';
      case 'document':
        return '📄';
      default:
        return '📄';
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!isEnrolled && lesson.type !== 'video'}>
      <View style={styles.lessonLeft}>
        <View style={styles.numberContainer}>
          <Text style={styles.numberText}>{index + 1}</Text>
        </View>
        <View style={styles.lessonInfo}>
          <Text style={styles.lessonTitle} numberOfLines={2}>
            {lesson.title}
          </Text>
          {lesson.duration && (
            <Text style={styles.duration}>⏱ {lesson.duration}</Text>
          )}
        </View>
      </View>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getIcon()}</Text>
      </View>
      {!isEnrolled && (
        <View style={styles.lockBadge}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F1F3',
  },
  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  numberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8E9F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  duration: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  iconContainer: {
    marginLeft: 8,
  },
  icon: {
    fontSize: 16,
  },
  lockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  lockIcon: {
    fontSize: 12,
  },
});
