import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Colors } from '../../theme';
import { CurriculumLesson } from './CurriculumLesson';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Lesson {
  _id: string;
  title: string;
  type: 'video' | 'document' | 'quiz';
  duration?: string;
  videoUrl?: string;
}

interface Subsection {
  _id: string;
  title: string;
  content: Lesson[];
}

interface CurriculumSubsectionProps {
  subsection: Subsection;
  isEnrolled: boolean;
  onLessonPress: (lessonId: string, lessonTitle: string) => void;
}

export const CurriculumSubsection: React.FC<CurriculumSubsectionProps> = ({
  subsection,
  isEnrolled,
  onLessonPress,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.container}>
      {/* Subsection Header */}
      <TouchableOpacity
        style={styles.subsectionHeader}
        onPress={toggleExpand}
        activeOpacity={0.7}>
        <View style={styles.subsectionLeft}>
          <View style={styles.iconContainer}>
            <Text style={styles.folderIcon}>📂</Text>
          </View>
          <View style={styles.subsectionInfo}>
            <Text style={styles.subsectionTitle} numberOfLines={2}>
              {subsection.title}
            </Text>
            <Text style={styles.lessonCount}>
              {subsection.content?.length || 0} {subsection.content?.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>
        <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Lessons */}
      {isExpanded && (
        <View style={styles.lessonsContainer}>
          {subsection.content?.map((lesson, index) => (
            <CurriculumLesson
              key={lesson._id}
              lesson={lesson}
              index={index}
              isEnrolled={isEnrolled}
              onPress={() => onLessonPress(lesson._id, lesson.title)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#E8E9F3',
    paddingLeft: 12,
  },
  subsectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FAFBFC',
    borderRadius: 12,
  },
  subsectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8E9F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderIcon: {
    fontSize: 16,
  },
  subsectionInfo: {
    flex: 1,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  lessonCount: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  expandIcon: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 8,
  },
  lessonsContainer: {
    marginTop: 8,
  },
});
