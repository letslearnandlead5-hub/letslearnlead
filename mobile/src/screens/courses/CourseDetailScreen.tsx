import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Course } from '../../types';
import { courseService } from '../../services/courseService';
import { enrollmentService } from '../../services/enrollmentService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Colors, Typography, Spacing, Radius, Shadows, Gradients } from '../../theme';

type CourseDetailParamList = {
  CourseDetail: { courseId: string; courseTitle?: string };
  SubjectSelection: { courseId: string; courseTitle?: string };
  VideoPlayer: { courseId: string; lessonId: string; lessonTitle?: string; subjectId?: string };
  PaymentSubmit: { courseId: string; courseTitle: string };
};
type Props = NativeStackScreenProps<CourseDetailParamList, 'CourseDetail'>;

const { width } = Dimensions.get('window');

export const CourseDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { courseId } = route.params;
  const insets = useSafeAreaInsets();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [progress, setProgress] = useState({ percentage: 0, completed: 0, total: 0, completedIds: [] as string[] });
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadCourse();
    checkEnrollment();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const response = await courseService.getCourseById(courseId);
      if (response.success && response.data) setCourse(response.data);
    } catch (err: any) {
      setError(err.userMessage || 'Failed to load course.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const response = await enrollmentService.verifyEnrollment(courseId);
      setIsEnrolled(response.enrolled);
      
      if (response.enrolled) {
        const progressData = await enrollmentService.getCourseProgress(courseId);
        const completedIds = progressData.completedLessons || [];
        setProgress({
          percentage: progressData.completionPercentage || 0,
          completed: completedIds.length,
          total: 0,
          completedIds,
        });
      }
    } catch {
      setIsEnrolled(false);
    }
  };

  const handleEnroll = async () => {
    if (!course) return;

    // Paid course → go to payment submission screen
    if (course.paymentEnabled || course.price > 0) {
      navigation.navigate('PaymentSubmit', {
        courseId,
        courseTitle: course.title,
      });
      return;
    }

    // Free course → direct enrollment
    setEnrolling(true);
    try {
      await courseService.enrollInCourse(courseId);
      setIsEnrolled(true);
      Alert.alert('🎉 Enrolled!', `You are now enrolled in "${course.title}". Start learning now!`);
    } catch (err: any) {
      Alert.alert('Error', err.userMessage || 'Enrollment failed. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  if (isLoading) return <LoadingSpinner fullScreen message="Loading course..." />;
  if (error || !course) return <ErrorMessage message={error || 'Course not found'} onRetry={loadCourse} />;

  const hasSubjects = (course.subjects?.length || 0) > 1;
  const contentSections = hasSubjects
    ? []
    : course.subjects?.[0]?.sections || course.sections || [];

  // Count all lessons
  let totalLessons = 0;
  if (hasSubjects) {
    for (const subject of course.subjects || []) {
      for (const section of subject.sections || []) {
        for (const sub of section.subsections || []) {
          totalLessons += sub.content?.filter(c => c.type === 'video').length || 0;
        }
      }
    }
  } else {
    for (const section of contentSections) {
      for (const sub of section.subsections || []) {
        totalLessons += sub.content?.filter(c => c.type === 'video').length || 0;
      }
    }
  }

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

  const completedLessonIds = new Set(progress.completedIds || []);

  const getSectionCompletion = (section: any) => {
    let total = 0;
    let completed = 0;
    section.subsections?.forEach((sub: any) => {
      sub.content?.forEach((item: any) => {
        total++;
        if (completedLessonIds.has(item._id)) completed++;
      });
    });
    return { completed, total };
  };

  const allLessons: Array<{ id: string; title: string; type: string; duration?: string }> = [];
  contentSections.forEach(section => {
    section.subsections.forEach(sub => {
      sub.content?.forEach(item => {
        allLessons.push({ id: item._id, title: item.title, type: item.type, duration: item.duration });
      });
    });
  });

  const descriptionLines = course.description.split('\n');
  const shortDescription = descriptionLines.slice(0, 3).join('\n');
  const hasMoreDescription = descriptionLines.length > 3;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={true}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        
        {/* Hero Banner with Custom Glass Effect */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: course.thumbnail || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(28,29,31,0.15)', 'rgba(28,29,31,0.85)']}
            style={styles.heroGradient}
          />
          
          {/* Back Button */}
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 12 }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          {/* Title and Instructor overlay */}
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{course.title}</Text>
            <View style={styles.heroMeta}>
              <Text style={styles.heroInstructor}>👨‍🏫 {course.instructor}</Text>
              <View style={styles.heroDivider} />
              <Text style={styles.heroRating}>⭐ {course.rating?.toFixed(1) || '4.5'}</Text>
            </View>
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.content}>
          {/* Stats Bar */}
          <View style={styles.quickStatsBar}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatIcon}>👥</Text>
              <Text style={styles.quickStatValue}>{course.studentsEnrolled || 0}</Text>
              <Text style={styles.quickStatLabel}>Students</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatIcon}>⏱</Text>
              <Text style={styles.quickStatValue}>{course.duration || 'N/A'}</Text>
              <Text style={styles.quickStatLabel}>Duration</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatIcon}>📚</Text>
              <Text style={styles.quickStatValue}>{totalLessons}</Text>
              <Text style={styles.quickStatLabel}>Lessons</Text>
            </View>
          </View>

          {/* Tags */}
          <View style={styles.tagsRow}>
            <View style={[styles.tag, styles.tagLevel]}>
              <Text style={[styles.tagText, { color: Colors.primary }]}>{course.level}</Text>
            </View>
            {course.medium && (
              <View style={[styles.tag, styles.tagMedium]}>
                <Text style={[styles.tagText, { color: Colors.secondary }]}>{course.medium}</Text>
              </View>
            )}
          </View>

          {/* Enrollment Progress Indicator */}
          {isEnrolled && (
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Your Learning Progress</Text>
                <Text style={styles.progressPercentage}>{Math.round(progress.percentage)}%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${progress.percentage}%` }]} />
              </View>
            </View>
          )}

          {/* Course Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Course</Text>
            <Text style={styles.description}>
              {showFullDescription ? course.description : shortDescription}
            </Text>
            {hasMoreDescription && (
              <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)} activeOpacity={0.7}>
                <Text style={styles.readMore}>
                  {showFullDescription ? 'Show Less' : 'Read More'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Subjects selection prompt for multi-subject courses */}
          {hasSubjects && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Course Subjects</Text>
              <Text style={styles.infoText}>This course contains multiple subjects. Access them by clicking the button below.</Text>
            </View>
          )}

          {/* Course Curriculum */}
          {!hasSubjects && (
            <View style={styles.section}>
              <View style={styles.curriculumHeader}>
                <Text style={styles.sectionTitle}>Course Curriculum</Text>
              </View>

              {course.sections?.map((section, sectionIndex) => {
                const sectionCompletion = getSectionCompletion(section);
                const isSectionExpanded = expandedSections[section._id];

                return (
                  <View key={section._id} style={styles.sectionContainer}>
                    {/* Section Header */}
                    <TouchableOpacity
                      style={[styles.sectionHeader, isSectionExpanded && styles.sectionHeaderExpanded]}
                      onPress={() => toggleSection(section._id)}
                      activeOpacity={0.85}>
                      <View style={styles.sectionLeft}>
                        <View style={[styles.sectionDot, sectionCompletion.completed > 0 && styles.sectionDotActive]} />
                        <View style={styles.sectionInfo}>
                          <Text style={styles.sectionTitle2}>{section.title}</Text>
                          <Text style={styles.sectionProgress}>
                            {sectionCompletion.completed}/{sectionCompletion.total} completed
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.sectionArrow}>{isSectionExpanded ? '▼' : '▶'}</Text>
                    </TouchableOpacity>

                    {/* Subsections */}
                    {isSectionExpanded && section.subsections?.map((subsection, subIndex) => {
                      const isSubExpanded = expandedSections[subsection._id];
                      const subTotal = subsection.content?.length || 0;
                      
                      // Calculate completed lessons in this subsection
                      let subCompleted = 0;
                      subsection.content?.forEach((item: any) => {
                        if (completedLessonIds.has(item._id)) subCompleted++;
                      });

                      return (
                        <View key={subsection._id} style={styles.subsectionContainer}>
                          {/* Subsection Header */}
                          <TouchableOpacity
                            style={[styles.subsectionHeader, isSubExpanded && styles.subsectionHeaderExpanded]}
                            onPress={() => toggleSubsection(subsection._id)}
                            activeOpacity={0.85}>
                            <View style={styles.subsectionLeft}>
                              <View style={[styles.subsectionDot, subCompleted > 0 && styles.subsectionDotActive]} />
                              <View style={styles.subsectionInfo}>
                                <Text style={styles.subsectionTitle}>
                                  {sectionIndex + 1}.{subIndex + 1} {subsection.title}
                                </Text>
                                <Text style={styles.subsectionProgress}>
                                  {subCompleted}/{subTotal} completed
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.subsectionArrow}>{isSubExpanded ? '▼' : '▶'}</Text>
                          </TouchableOpacity>

                          {/* Lessons */}
                          {isSubExpanded && subsection.content?.map((lesson, lessonIndex) => {
                            const isLessonCompleted = completedLessonIds.has(lesson._id);
                            return (
                              <TouchableOpacity
                                key={lesson._id}
                                style={[
                                  styles.lessonItem,
                                  isLessonCompleted && styles.lessonItemCompleted,
                                ]}
                                activeOpacity={0.7}
                                onPress={() => {
                                  if (lesson.type === 'video' && isEnrolled) {
                                    navigation.navigate('VideoPlayer', {
                                      courseId: course._id,
                                      lessonId: lesson._id,
                                      lessonTitle: lesson.title,
                                    });
                                  } else if (!isEnrolled) {
                                    Alert.alert('Enrollment Required', 'Please enroll in this course to access lessons.');
                                  } else {
                                    Alert.alert('Coming Soon', `${lesson.type} lessons coming soon!`);
                                  }
                                }}>
                                <View style={styles.lessonLeft}>
                                  <View style={[
                                    styles.lessonDot, 
                                    isLessonCompleted && styles.lessonDotActive
                                  ]} />
                                  <Text style={[
                                    styles.lessonText,
                                    isLessonCompleted && styles.lessonTextCompleted
                                  ]}>
                                    {sectionIndex + 1}.{subIndex + 1}.{lessonIndex + 1} {lesson.title}
                                  </Text>
                                </View>
                                <View style={[
                                  styles.lessonTypeBadge, 
                                  { backgroundColor: isLessonCompleted ? Colors.successSoft : Colors.primarySoft }
                                ]}>
                                  <Text style={[
                                    styles.lessonTypeText, 
                                    { color: isLessonCompleted ? Colors.success : Colors.primary }
                                  ]}>
                                    {isLessonCompleted ? 'Done ✓' : 'Video 🎥'}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          )}

        </View>
      </ScrollView>

      {/* Sticky Bottom Enroll/Continue Bar */}
      <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 12 }]}>
        {isEnrolled ? (
          <View style={styles.enrolledContainer}>
            <View style={styles.enrolledBadge}>
              <Text style={styles.enrolledText}>✓ Enrolled</Text>
            </View>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => {
                if (hasSubjects) {
                  navigation.navigate('SubjectSelection', {
                    courseId: course._id,
                    courseTitle: course.title,
                  });
                } else {
                  const firstVideo = allLessons.find(l => l.type === 'video');
                  if (firstVideo) {
                    navigation.navigate('VideoPlayer', {
                      courseId: course._id,
                      lessonId: firstVideo.id,
                      lessonTitle: firstVideo.title,
                    });
                  } else {
                    Alert.alert('No Videos', 'No video lessons found in this course.');
                  }
                }
              }}
              activeOpacity={0.9}>
              <LinearGradient
                colors={Gradients.primary as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueGradient}>
                <Text style={styles.continueText}>
                  {hasSubjects ? '📚 View Subjects' : '▶ Start Learning'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.enrollButton}
            onPress={handleEnroll}
            disabled={enrolling}
            activeOpacity={0.9}>
            <LinearGradient
              colors={Gradients.primary as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.enrollGradient}>
              <Text style={styles.enrollText}>
                {enrolling ? 'Enrolling...' : course.price === 0 ? 'Enroll for Free' : `Enroll Now — ₹${course.price}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background,
  },
  heroContainer: { 
    width, 
    height: 250, 
    position: 'relative',
  },
  heroImage: { 
    width: '100%', 
    height: '100%',
  },
  heroGradient: { 
    ...StyleSheet.absoluteFillObject,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(28, 29, 31, 0.45)',
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { 
    color: '#FFFFFF', 
    fontSize: 22, 
    fontWeight: '700',
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  heroTitle: {
    ...Typography.h2,
    color: '#FFFFFF',
    lineHeight: 32,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroInstructor: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
  },
  heroDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  heroRating: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
  },
  content: { 
    paddingHorizontal: Spacing.md, 
    paddingTop: Spacing.md,
  },
  quickStatsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  quickStatValue: {
    ...Typography.h6,
    color: Colors.text,
    fontWeight: '700',
  },
  quickStatLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  tagLevel: {
    backgroundColor: Colors.primarySoft,
  },
  tagMedium: {
    backgroundColor: Colors.secondarySoft,
  },
  tagText: {
    ...Typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '700',
  },
  progressPercentage: {
    ...Typography.h3,
    color: Colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.progressTrack,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '800',
    marginBottom: 10,
  },
  curriculumHeader: {
    marginBottom: 12,
  },
  sectionContainer: {
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    backgroundColor: Colors.divider,
    padding: Spacing.md,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: Colors.borderLight,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    backgroundColor: 'transparent',
  },
  sectionDotActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle2: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '700',
  },
  sectionProgress: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionArrow: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  subsectionContainer: {
    marginLeft: 16,
    marginTop: 6,
  },
  subsectionHeader: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  subsectionHeaderExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  subsectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  subsectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    backgroundColor: 'transparent',
  },
  subsectionDotActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  subsectionInfo: {
    flex: 1,
  },
  subsectionTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text,
  },
  subsectionProgress: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  subsectionArrow: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  lessonItem: {
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: Radius.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  lessonItemCompleted: {
    backgroundColor: Colors.successSoft,
    borderColor: 'rgba(30,158,107,0.15)',
  },
  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  lessonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    backgroundColor: 'transparent',
  },
  lessonDotActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  lessonText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
  },
  lessonTextCompleted: {
    color: Colors.success,
    fontWeight: '600',
  },
  lessonTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  lessonTypeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  readMore: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 8,
  },
  infoText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
    borderTopWidth: 1,
    borderColor: Colors.divider,
  },
  enrolledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  enrolledBadge: {
    backgroundColor: Colors.successSoft,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(30,158,107,0.15)',
  },
  enrolledText: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.success,
  },
  continueButton: {
    flex: 1,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  continueGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    ...Typography.button,
    color: '#FFFFFF',
  },
  enrollButton: {
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  enrollGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enrollText: {
    ...Typography.button,
    color: '#FFFFFF',
  },
});
