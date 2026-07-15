import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeStackParamList, CourseContent, CourseSection, CourseSubject } from '../../types';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { courseService } from '../../services/courseService';
import { enrollmentService } from '../../services/enrollmentService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = (SCREEN_WIDTH * 9) / 16;

type Props = NativeStackScreenProps<HomeStackParamList, 'VideoPlayer'>;

// Extract YouTube video ID from URL
const extractYouTubeId = (url: string): string => {
  if (!url) return '';
  
  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return url; // Return as-is if no pattern matches
};

export const VideoPlayerScreen: React.FC<Props> = ({ route, navigation }) => {
  const { courseId, lessonId, lessonTitle, subjectId } = route.params;
  const insets = useSafeAreaInsets();
  const playerRef = useRef<any>(null);

  const [activeSubject, setActiveSubject] = useState<CourseSubject | null>(null);
  const [currentLesson, setCurrentLesson] = useState<CourseContent | null>(null);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalLessons, setTotalLessons] = useState(0);
  // Track which lessons have been completed in this session
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());

  // Demo YouTube video ID (Big Buck Bunny)
  const defaultVideoId = 'aqz-KE-bpKQ';
  const currentVideoId = currentLesson?.videoUrl 
    ? extractYouTubeId(currentLesson.videoUrl) 
    : defaultVideoId;

  useEffect(() => {
    loadCourseData();
  }, []);

  const loadCourseData = async () => {
    try {
      const response = await courseService.getCourseById(courseId);
      if (response.success && response.data) {
        const course = response.data;

        // Filter sections by the active subject instead of mixing all subjects together
        let allSections: CourseSection[] = [];
        let selectedSubject: CourseSubject | null = null;

        if (course.subjects?.length) {
          // 1. Try matching by subjectId param
          if (subjectId) {
            selectedSubject = course.subjects.find(s => s._id === subjectId) || null;
          }
          // 2. Fallback: try finding subject that contains lessonId
          if (!selectedSubject && lessonId) {
            selectedSubject = course.subjects.find(s =>
              (s.sections || []).some(sec =>
                (sec.subsections || []).some(sub =>
                  (sub.content || []).some(item => item._id === lessonId)
                )
              )
            ) || null;
          }
          // 3. Fallback: select first subject
          if (!selectedSubject) {
            selectedSubject = course.subjects[0];
          }

          setActiveSubject(selectedSubject);
          allSections = selectedSubject.sections || [];
        } else {
          allSections = course.sections || [];
        }
        setCourseSections(allSections);
        
        // Calculate total video lessons
        let total = 0;
        allSections.forEach(section => {
          section.subsections.forEach(subsection => {
            total += subsection.content.filter(c => c.type === 'video').length;
          });
        });
        setTotalLessons(total);
        
        // Find current lesson across all sections
        let foundLesson: CourseContent | null = null;
        outer:
        for (const section of allSections) {
          for (const subsection of section.subsections) {
            for (const content of subsection.content) {
              if (content._id === lessonId && content.type === 'video') {
                foundLesson = content;
                break outer;
              }
            }
          }
        }
        
        if (foundLesson) {
          setCurrentLesson(foundLesson);
        } else {
          // Fall back to first video
          for (const section of allSections) {
            for (const subsection of section.subsections) {
              const firstVideo = subsection.content.find(c => c.type === 'video');
              if (firstVideo) {
                setCurrentLesson(firstVideo);
                break;
              }
            }
          }
        }

        // Load existing progress from backend
        try {
          const progressData = await enrollmentService.getCourseProgress(courseId);
          if (progressData.completedLessons?.length) {
            setCompletedLessonIds(new Set(progressData.completedLessons));
          }
        } catch { /* ignore progress load failure */ }
      }
    } catch (err) {
      console.error('Failed to load course:', err);
      setError('Failed to load course data');
    }
  };

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      handleVideoComplete();
      playNextLesson();
    } else if (state === 'playing') {
      setIsPlaying(true);
    } else if (state === 'paused') {
      setIsPlaying(false);
    }
  }, []);

  const onReady = useCallback(() => {
    setIsReady(true);
  }, []);

  const handleVideoComplete = async () => {
    if (!currentLesson) return;
    const lessonId = currentLesson._id;

    // Add to local completed set
    setCompletedLessonIds(prev => {
      const updated = new Set(prev);
      updated.add(lessonId);

      // ✅ Save to backend immediately — this is the critical fix
      // The backend will validate that these IDs belong to this course.
      const completedArray = Array.from(updated);
      enrollmentService.updateProgress(courseId, completedArray)
        .then(() => console.log(`✅ Progress saved: ${completedArray.length} lessons`)
        ).catch(err => console.warn('⚠️ Progress save failed:', err));

      return updated;
    });
  };

  const playNextLesson = () => {
    // Find next video lesson
    let foundCurrent = false;
    let nextLesson: CourseContent | null = null;
    
    for (const section of courseSections) {
      for (const subsection of section.subsections) {
        for (const content of subsection.content) {
          if (content.type === 'video') {
            if (foundCurrent) {
              nextLesson = content;
              break;
            }
            if (content._id === currentLesson?._id) {
              foundCurrent = true;
            }
          }
        }
        if (nextLesson) break;
      }
      if (nextLesson) break;
    }
    
    if (nextLesson) {
      setCurrentLesson(nextLesson);
      setIsReady(false);
    }
  };

  const playPreviousLesson = () => {
    // Find previous video lesson
    let previousLesson: CourseContent | null = null;
    let foundCurrent = false;
    
    for (const section of courseSections) {
      for (const subsection of section.subsections) {
        for (const content of subsection.content) {
          if (content.type === 'video') {
            if (content._id === currentLesson?._id) {
              foundCurrent = true;
              break;
            }
            previousLesson = content;
          }
        }
        if (foundCurrent) break;
      }
      if (foundCurrent) break;
    }
    
    if (previousLesson) {
      setCurrentLesson(previousLesson);
      setIsReady(false);
    }
  };

  const hasNextLesson = () => {
    let foundCurrent = false;
    for (const section of courseSections) {
      for (const subsection of section.subsections) {
        for (const content of subsection.content) {
          if (content.type === 'video') {
            if (foundCurrent) return true;
            if (content._id === currentLesson?._id) foundCurrent = true;
          }
        }
      }
    }
    return false;
  };

  const hasPreviousLesson = () => {
    for (const section of courseSections) {
      for (const subsection of section.subsections) {
        for (const content of subsection.content) {
          if (content.type === 'video') {
            if (content._id === currentLesson?._id) return false;
            return true;
          }
        }
      }
    }
    return false;
  };

  const playLesson = (lesson: CourseContent) => {
    setCurrentLesson(lesson);
    setIsReady(false);
    setIsPlaying(false);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const toggleSubsection = (subsectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [subsectionId]: !prev[subsectionId],
    }));
  };

  const renderLessonItem = ({ item, index }: { item: CourseContent; index: number }) => {
    const isActive = item._id === currentLesson?._id;
    
    return (
      <TouchableOpacity
        style={[styles.lessonItem, isActive && styles.lessonItemActive]}
        onPress={() => playLesson(item)}
        activeOpacity={0.7}>
        <View style={styles.lessonLeft}>
          <Text style={[styles.lessonNumber, isActive && styles.lessonNumberActive]}>
            {index + 1}
          </Text>
          <View style={styles.lessonInfo}>
            <Text style={[styles.lessonName, isActive && styles.lessonNameActive]} numberOfLines={2}>
              {item.title}
            </Text>
            {item.duration && (
              <Text style={styles.lessonDuration}>⏱ {item.duration}</Text>
            )}
          </View>
        </View>
        {isActive && (
          <View style={styles.playingBadge}>
            <Text style={styles.playingText}>▶ Playing</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHierarchicalContent = () => {
    return courseSections.map((section, sectionIndex) => {
      const isSectionExpanded = expandedSections[section._id];
      
      return (
        <View key={section._id} style={styles.sectionContainer}>
          {/* Section Header */}
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection(section._id)}
            activeOpacity={0.7}>
            <Text style={styles.sectionTitle2}>{section.title}</Text>
            <Text style={styles.sectionArrow}>{isSectionExpanded ? '▼' : '▶'}</Text>
          </TouchableOpacity>

          {/* Subsections */}
          {isSectionExpanded && section.subsections.map((subsection, subIndex) => {
            const isSubExpanded = expandedSections[subsection._id];
            const videoLessons = subsection.content.filter(c => c.type === 'video');

            return (
              <View key={subsection._id} style={styles.subsectionContainer}>
                {/* Subsection Header */}
                <TouchableOpacity
                  style={styles.subsectionHeader}
                  onPress={() => toggleSubsection(subsection._id)}
                  activeOpacity={0.7}>
                  <Text style={styles.subsectionTitle}>
                    {sectionIndex + 1}.{subIndex + 1} {subsection.title}
                  </Text>
                  <Text style={styles.subsectionArrow}>{isSubExpanded ? '▼' : '▶'}</Text>
                </TouchableOpacity>

                {/* Lessons */}
                {isSubExpanded && videoLessons.map((lesson, lessonIndex) => {
                  const isActive = lesson._id === currentLesson?._id;
                  
                  return (
                    <TouchableOpacity
                      key={lesson._id}
                      style={[styles.lessonItemHierarchical, isActive && styles.lessonItemHierarchicalActive]}
                      onPress={() => playLesson(lesson)}
                      activeOpacity={0.7}>
                      <View style={styles.lessonLeft}>
                        <Text style={[styles.lessonNumberHierarchical, isActive && styles.lessonNumberHierarchicalActive]}>
                          {lessonIndex + 1}
                        </Text>
                        <View style={styles.lessonInfo}>
                          <Text style={[styles.lessonNameHierarchical, isActive && styles.lessonNameHierarchicalActive]} numberOfLines={2}>
                            {lesson.title}
                          </Text>
                          {lesson.duration && (
                            <Text style={styles.lessonDurationHierarchical}>⏱ {lesson.duration}</Text>
                          )}
                        </View>
                      </View>
                      {isActive && (
                        <View style={styles.playingBadge2}>
                          <Text style={styles.playingText2}>▶ Playing</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>
      );
    });
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {activeSubject ? `${activeSubject.name} • ${currentLesson?.title || lessonTitle}` : (currentLesson?.title || lessonTitle || 'Video Lesson')}
        </Text>
      </View>

      {/* YouTube Video Player */}
      <View style={styles.videoContainer}>
        {!isReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}
        <YoutubePlayer
          ref={playerRef}
          height={VIDEO_HEIGHT}
          play={false}
          videoId={currentVideoId}
          onChangeState={onStateChange}
          onReady={onReady}
          webViewStyle={styles.webView}
        />
      </View>

      {/* Course Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}>
        {/* Current Lesson Info */}
        <View style={styles.lessonHeader}>
          <Text style={styles.lessonTitle}>{currentLesson?.title || 'Video Lesson'}</Text>
          {currentLesson?.duration && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>⏱ {currentLesson.duration}</Text>
            </View>
          )}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[styles.navButton, !hasPreviousLesson() && styles.navButtonDisabled]}
            onPress={playPreviousLesson}
            disabled={!hasPreviousLesson()}
            activeOpacity={0.7}>
            <Text style={[styles.navButtonText, !hasPreviousLesson() && styles.navButtonTextDisabled]}>
              ← Previous
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonNext, !hasNextLesson() && styles.navButtonDisabled]}
            onPress={playNextLesson}
            disabled={!hasNextLesson()}
            activeOpacity={0.7}>
            <Text style={[styles.navButtonText, !hasNextLesson() && styles.navButtonTextDisabled]}>
              Next →
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Lessons List - Hierarchical */}
        <View style={styles.lessonsSection}>
          <Text style={styles.sectionTitleMain}>
            Course Content ({totalLessons} lessons)
          </Text>
          {renderHierarchicalContent()}
        </View>
      </ScrollView>
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
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    color: Colors.text,
  },
  headerTitle: {
    flex: 1,
    ...Typography.h5,
    color: Colors.text,
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
    position: 'relative',
  },
  webView: {
    opacity: 0.99, // Fix for Android rendering
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 10,
  },
  loadingText: {
    color: '#FFF',
    marginTop: Spacing.sm,
    ...Typography.body,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  lessonHeader: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  lessonTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  durationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.progressBackground,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    marginTop: Spacing.xs,
  },
  durationText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  navigationButtons: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonNext: {
    backgroundColor: '#4F46E5',
  },
  navButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  navButtonTextDisabled: {
    color: '#9CA3AF',
  },
  divider: {
    height: 8,
    backgroundColor: Colors.divider,
  },
  lessonsSection: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  sectionTitleMain: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  sectionContainer: {
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    backgroundColor: '#F3F4F6',
    padding: Spacing.md,
    borderRadius: Radius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle2: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  sectionArrow: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  subsectionContainer: {
    marginLeft: Spacing.md,
    marginTop: Spacing.xs,
  },
  subsectionHeader: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.sm + 2,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  subsectionArrow: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  lessonItemHierarchical: {
    backgroundColor: '#F9FAFB',
    padding: Spacing.sm + 2,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
    marginLeft: Spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  lessonItemHierarchicalActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
    borderWidth: 2,
  },
  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  lessonNumberHierarchical: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textMuted,
    minWidth: 24,
  },
  lessonNumberHierarchicalActive: {
    color: '#4F46E5',
  },
  lessonNameHierarchical: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  lessonNameHierarchicalActive: {
    fontWeight: '600',
    color: '#4F46E5',
  },
  lessonDurationHierarchical: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  playingBadge2: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  playingText2: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lessonItemActive: {
    backgroundColor: Colors.progressBackground,
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  lessonNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textMuted,
    marginRight: Spacing.sm,
    minWidth: 24,
  },
  lessonNumberActive: {
    color: Colors.primary,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonName: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: 4,
  },
  lessonNameActive: {
    fontWeight: '600',
    color: Colors.primary,
  },
  lessonDuration: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  playingBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  playingText: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.h5,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  backButtonText: {
    ...Typography.button,
    color: Colors.textOnPrimary,
  },
});
