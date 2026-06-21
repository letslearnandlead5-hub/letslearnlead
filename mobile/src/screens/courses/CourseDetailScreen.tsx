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
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Course } from '../../types';
import { courseService } from '../../services/courseService';
import { enrollmentService } from '../../services/enrollmentService';
import { AppButton } from '../../components/ui/AppButton';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme';

// A minimal param list scoped to this screen so it's reusable across any
// stack that contains a 'CourseDetail' screen (HomeStack, MyCoursesStack, etc.)
type CourseDetailParamList = {
  CourseDetail: { courseId: string; courseTitle?: string };
  VideoPlayer: { courseId: string; lessonId: string; lessonTitle?: string };
};
type Props = NativeStackScreenProps<CourseDetailParamList, 'CourseDetail'>;

const { width, height } = Dimensions.get('window');

export const CourseDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { courseId } = route.params;
  const insets = useSafeAreaInsets();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [progress, setProgress] = useState({ percentage: 0, completed: 0, total: 0 });
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
        // Fetch progress
        const progressData = await enrollmentService.getCourseProgress(courseId);
        const completedCount = progressData.completedLessons?.length || 0;
        
        // Calculate actual percentage from completed lessons (ignore backend percentage if inconsistent)
        setProgress({
          percentage: progressData.completionPercentage || 0,
          completed: completedCount,
          total: 0, // Will be calculated from course data
        });
      }
    } catch {
      setIsEnrolled(false);
    }
  };

  const handleEnroll = async () => {
    if (!course) return;
    if (course.price > 0) {
      Alert.alert(
        'Paid Course',
        `This course costs ₹${course.price}. Please visit our website to complete the payment and enroll.`,
        [{ text: 'OK' }]
      );
      return;
    }

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

  // Calculate total VIDEO lessons only (not documents or quizzes)
  const totalLessons = course.sections?.reduce(
    (acc, s) => acc + s.subsections.reduce((a, sub) => {
      const videoCount = sub.content?.filter(c => c.type === 'video').length || 0;
      return a + videoCount;
    }, 0),
    0
  ) || 0;

  // Update progress total and recalculate percentage if needed
  if (progress.total === 0 && totalLessons > 0) {
    const actualPercentage = totalLessons > 0 ? (progress.completed / totalLessons) * 100 : 0;
    setProgress(prev => ({ 
      ...prev, 
      total: totalLessons,
      percentage: actualPercentage, // Use calculated percentage instead of backend value
    }));
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

  // Calculate completion for sections
  const getSectionCompletion = (section: any) => {
    let total = 0;
    let completed = 0;
    section.subsections?.forEach((sub: any) => {
      sub.content?.forEach((item: any) => {
        total++;
        if (progress.completed > 0) completed++; // Simplified - you'd check actual completion
      });
    });
    return { completed, total };
  };

  // Flatten all lessons for first video
  const allLessons: Array<{ id: string; title: string; type: string; duration?: string }> = [];
  course.sections?.forEach(section => {
    section.subsections.forEach(sub => {
      sub.content?.forEach(item => {
        allLessons.push({
          id: item._id,
          title: item.title,
          type: item.type,
          duration: item.duration,
        });
      });
    });
  });

  const descriptionLines = course.description.split('\n');
  const shortDescription = descriptionLines.slice(0, 3).join('\n');
  const hasMoreDescription = descriptionLines.length > 3;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
        {/* Hero Image with Title Overlay */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: course.thumbnail || 'https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Course' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.85)']}
            style={styles.heroGradient}
          />
          
          {/* Back Button */}
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 12 }]}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          {/* Course Title on Image */}
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{course.title}</Text>
            <View style={styles.heroMeta}>
              <Text style={styles.heroInstructor}>👨‍🏫 {course.instructor}</Text>
              <View style={styles.heroDivider} />
              <Text style={styles.heroRating}>⭐ {course.rating?.toFixed(1) || '4.5'}</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Quick Stats Bar */}
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
              <Text style={styles.quickStatIcon}>📘</Text>
              <Text style={styles.quickStatValue}>{totalLessons}</Text>
              <Text style={styles.quickStatLabel}>Lessons</Text>
            </View>
          </View>

          {/* Tags - Only 2 */}
          <View style={styles.tagsRow}>
            <View style={[styles.tag, styles.tagLevel]}>
              <Text style={styles.tagText}>{course.level}</Text>
            </View>
            {course.medium && (
              <View style={[styles.tag, styles.tagMedium]}>
                <Text style={styles.tagText}>{course.medium}</Text>
              </View>
            )}
          </View>

          {/* Progress Bar (if enrolled) */}
          {isEnrolled && (
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Your Progress</Text>
                <Text style={styles.progressPercentage}>{Math.round(progress.percentage)}%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${progress.percentage}%` }]} />
              </View>
            </View>
          )}

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Course</Text>
            <Text style={styles.description}>
              {showFullDescription ? course.description : shortDescription}
            </Text>
            {hasMoreDescription && (
              <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)}>
                <Text style={styles.readMore}>
                  {showFullDescription ? 'Show Less' : 'Read More'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Curriculum - Hierarchical Structure */}
          <View style={styles.section}>
            <View style={styles.curriculumHeader}>
              <Text style={styles.sectionTitle}>Course Content</Text>
            </View>

            {course.sections?.map((section, sectionIndex) => {
              const sectionCompletion = getSectionCompletion(section);
              const isSectionExpanded = expandedSections[section._id];

              return (
                <View key={section._id} style={styles.sectionContainer}>
                  {/* Section Header */}
                  <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={() => toggleSection(section._id)}
                    activeOpacity={0.7}>
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
                    const subCompleted = 0; // Simplified

                    return (
                      <View key={subsection._id} style={styles.subsectionContainer}>
                        {/* Subsection Header */}
                        <TouchableOpacity
                          style={styles.subsectionHeader}
                          onPress={() => toggleSubsection(subsection._id)}
                          activeOpacity={0.7}>
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
                        {isSubExpanded && subsection.content?.map((lesson, lessonIndex) => (
                          <TouchableOpacity
                            key={lesson._id}
                            style={[
                              styles.lessonItem,
                              lessonIndex === 0 && styles.lessonItemActive,
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
                                Alert.alert('Enroll Required', 'Please enroll in this course to access lessons.');
                              } else {
                                Alert.alert('Coming Soon', `${lesson.type} lessons coming soon!`);
                              }
                            }}>
                            <View style={styles.lessonLeft}>
                              <View style={[styles.lessonDot, lessonIndex === 0 && styles.lessonDotActive]} />
                              <Text style={[styles.lessonText, lessonIndex === 0 && styles.lessonTextActive]}>
                                {sectionIndex + 1}.{subIndex + 1}.{lessonIndex + 1} {lesson.title}
                              </Text>
                            </View>
                            <View style={styles.lessonTypeBadge2}>
                              <Text style={styles.lessonTypeText2}>video</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>

          {/* Spacer for sticky button */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Sticky Bottom CTA */}
      <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 12 }]}>
        {isEnrolled ? (
          <View style={styles.enrolledContainer}>
            <View style={styles.enrolledBadge}>
              <Text style={styles.enrolledText}>✓ Enrolled</Text>
            </View>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => {
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
              }}
              activeOpacity={0.9}>
              <LinearGradient
                colors={['#4F46E5', '#6366F1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueGradient}>
                <Text style={styles.continueText}>▶ Continue Learning</Text>
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
              colors={['#4F46E5', '#6366F1']}
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
    backgroundColor: '#F9FAFB',
  },
  heroContainer: { 
    width, 
    height: 300, 
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
    width: 44,
    height: 44,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  backIcon: { 
    color: '#FFFFFF', 
    fontSize: 26, 
    fontWeight: '700',
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 34,
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroInstructor: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  heroRating: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  content: { 
    paddingHorizontal: 16, 
    paddingTop: 20,
  },
  quickStatsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagLevel: {
    backgroundColor: '#EEF2FF',
  },
  tagMedium: {
    backgroundColor: '#FEF3C7',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4F46E5',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 5,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 14,
  },
  curriculumHeader: {
    marginBottom: 16,
  },
  sectionContainer: {
    marginBottom: 12,
  },
  sectionHeader: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  sectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'transparent',
  },
  sectionDotActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle2: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionProgress: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  sectionArrow: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  subsectionContainer: {
    marginLeft: 24,
    marginTop: 8,
  },
  subsectionHeader: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subsectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  subsectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'transparent',
  },
  subsectionDotActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  subsectionInfo: {
    flex: 1,
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 3,
  },
  subsectionProgress: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  subsectionArrow: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  lessonItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    marginLeft: 20,
  },
  lessonItemActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  lessonDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'transparent',
  },
  lessonDotActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  lessonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  lessonTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  lessonTypeBadge2: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lessonTypeText2: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  bottomProgressCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bottomProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bottomProgressLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  bottomProgressPercentage: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4F46E5',
  },
  bottomProgressBarContainer: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  bottomProgressBarFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 5,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  readMore: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4F46E5',
    marginTop: 10,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  enrolledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  enrolledBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  enrolledText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  continueButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  continueGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  enrollButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  enrollGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enrollText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
