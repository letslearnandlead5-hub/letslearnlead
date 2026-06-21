import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Colors } from '../../theme';
import { CurriculumSection } from './CurriculumSection';

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

interface CurriculumProps {
  sections: Section[];
  isEnrolled: boolean;
  onLessonPress: (lessonId: string, lessonTitle: string) => void;
}

export const Curriculum: React.FC<CurriculumProps> = ({
  sections,
  isEnrolled,
  onLessonPress,
}) => {
  const totalLessons = sections.reduce(
    (acc, section) =>
      acc +
      section.subsections.reduce(
        (subAcc, sub) => subAcc + (sub.content?.length || 0),
        0
      ),
    0
  );

  if (!sections || sections.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📚</Text>
        <Text style={styles.emptyText}>No curriculum available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Curriculum</Text>
        <Text style={styles.subtitle}>
          {sections.length} {sections.length === 1 ? 'section' : 'sections'} • {totalLessons}{' '}
          {totalLessons === 1 ? 'lesson' : 'lessons'}
        </Text>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <CurriculumSection
            section={item}
            isEnrolled={isEnrolled}
            onLessonPress={onLessonPress}
          />
        )}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
