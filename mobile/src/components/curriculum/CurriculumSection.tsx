import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Colors } from '../../theme';
import { CurriculumSubsection } from './CurriculumSubsection';

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

interface Section {
  _id: string;
  title: string;
  subsections: Subsection[];
}

interface CurriculumSectionProps {
  section: Section;
  isEnrolled: boolean;
  onLessonPress: (lessonId: string, lessonTitle: string) => void;
}

export const CurriculumSection: React.FC<CurriculumSectionProps> = ({
  section,
  isEnrolled,
  onLessonPress,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalLessons = section.subsections.reduce(
    (acc, sub) => acc + (sub.content?.length || 0),
    0
  );

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={toggleExpand}
        activeOpacity={0.7}>
        <View style={styles.sectionLeft}>
          <View style={styles.iconContainer}>
            <Text style={styles.folderIcon}>📁</Text>
          </View>
          <View style={styles.sectionInfo}>
            <Text style={styles.sectionTitle} numberOfLines={2}>
              {section.title}
            </Text>
            <Text style={styles.lessonCount}>
              {totalLessons} {totalLessons === 1 ? 'lesson' : 'lessons'}
            </Text>
          </View>
        </View>
        <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Subsections */}
      {isExpanded && (
        <View style={styles.subsectionsContainer}>
          {section.subsections.map((subsection) => (
            <CurriculumSubsection
              key={subsection._id}
              subsection={subsection}
              isEnrolled={isEnrolled}
              onLessonPress={onLessonPress}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E9F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderIcon: {
    fontSize: 20,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  lessonCount: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  expandIcon: {
    fontSize: 14,
    color: Colors.textMuted,
    marginLeft: 8,
  },
  subsectionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
});
