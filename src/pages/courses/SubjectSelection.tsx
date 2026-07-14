import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, BookOpen, CheckCircle2, Lock } from 'lucide-react';
import { courseAPI } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface SubjectCard {
    _id: string;
    name: string;
    icon: string;
    description: string;
    totalLessons: number;
    completedLessons: number;
    progressPct: number;
    firstLessonId: string;
}

const SubjectSelection: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { token } = useAuthStore();

    const [course, setCourse] = useState<any>(null);
    const [subjects, setSubjects] = useState<SubjectCard[]>([]);
    const [enrolledSubjectIds, setEnrolledSubjectIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!courseId || !token) return;
        loadData();
    }, [courseId, token]);

    const loadData = async () => {
        try {
            setLoading(true);
            const courseRes = await courseAPI.getById(courseId!);
            const courseData = courseRes.data?.data || courseRes.data;
            setCourse(courseData);

            const enrollRes = await fetch(`${API_URL}/api/enrollment/my-enrollments`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const enrollData = await enrollRes.json();
            const enrollments: any[] = enrollData.data || [];
            const courseEnrollment = enrollments.find(
                (e: any) => (e.courseId?._id || e.courseId) === courseId
            );
            const subjectIds: string[] = courseEnrollment?.enrolledSubjectIds || [];
            setEnrolledSubjectIds(subjectIds);

            const dbCompletedList: string[] = courseEnrollment?.completedLessons || [];
            const cards: SubjectCard[] = (courseData.subjects || []).map((sub: any) => {
                const storageKey = `course-${courseId}-subject-${sub._id}-completed`;
                const savedCompleted: string[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
                const completedSet = new Set([...dbCompletedList, ...savedCompleted]);


                let totalLessons = 0;
                let completedLessons = 0;
                let firstLessonId = '';

                for (const section of sub.sections || []) {
                    for (const subsection of section.subsections || []) {
                        for (const item of subsection.content || []) {
                            if (!firstLessonId && item._id) firstLessonId = item._id.toString();
                            totalLessons++;
                            if (completedSet.has(item._id)) completedLessons++;
                        }
                    }
                }

                const progressPct = totalLessons > 0
                    ? Math.round((completedLessons / totalLessons) * 100)
                    : 0;

                return {
                    _id: sub._id?.toString(),
                    name: sub.name || 'Subject',
                    icon: sub.icon || '📚',
                    description: sub.description || '',
                    totalLessons,
                    completedLessons,
                    progressPct,
                    firstLessonId,
                };
            });

            setSubjects(cards);

            // Option A: auto-skip if only 1 subject
            if (cards.length === 1 && cards[0].firstLessonId) {
                navigate(`/video/${courseId}/${cards[0].firstLessonId}/`, { replace: true });
                return;
            }
        } catch (err) {
            console.error('SubjectSelection error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubjectClick = (sub: SubjectCard) => {
        if (!sub.firstLessonId) return;
        navigate(`/video/${courseId}/${sub.firstLessonId}/`);
    };

    const isUnlocked = (subId: string) =>
        enrolledSubjectIds.length === 0 || enrolledSubjectIds.includes(subId);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 dark:text-gray-400">Loading subjects...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
            {/* Course Banner */}
            <div className="relative h-52 overflow-hidden">
                {course?.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-violet-700" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

                <button
                    onClick={() => navigate('/dashboard/?tab=courses')}
                    className="absolute top-5 left-5 flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl text-sm font-medium transition-all"
                >
                    <ArrowLeft className="w-4 h-4" />
                    My Courses
                </button>

                <div className="absolute bottom-5 left-6">
                    <p className="text-white/70 text-xs uppercase tracking-widest font-semibold mb-1">Course</p>
                    <h1 className="text-white text-2xl font-bold">{course?.title || 'Course'}</h1>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose a Subject</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Select the subject you want to study today
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {subjects.map((sub, idx) => {
                        const unlocked = isUnlocked(sub._id);
                        const started = sub.completedLessons > 0;
                        const done = sub.progressPct === 100;

                        return (
                            <motion.div
                                key={sub._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.07 }}
                                onClick={() => unlocked && handleSubjectClick(sub)}
                                className={`relative rounded-2xl border bg-white dark:bg-gray-900 overflow-hidden group transition-all duration-300 ${
                                    unlocked
                                        ? 'border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-100 dark:hover:shadow-indigo-950/30 cursor-pointer'
                                        : 'border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed'
                                }`}
                            >
                                {/* Progress top strip */}
                                <div className="h-1 bg-gray-100 dark:bg-gray-800 w-full">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                                        style={{ width: `${sub.progressPct}%` }}
                                    />
                                </div>

                                <div className="p-5">
                                    {/* Icon + badge */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-3xl">
                                            {sub.icon}
                                        </div>
                                        {done ? (
                                            <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                                <CheckCircle2 className="w-3 h-3" /> Done
                                            </span>
                                        ) : started ? (
                                            <span className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded-full">
                                                <Play className="w-3 h-3" fill="currentColor" /> In Progress
                                            </span>
                                        ) : !unlocked ? (
                                            <Lock className="w-4 h-4 text-gray-400" />
                                        ) : null}
                                    </div>

                                    {/* Name */}
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {sub.name}
                                    </h3>
                                    {sub.description && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                                            {sub.description}
                                        </p>
                                    )}

                                    {/* Lesson count */}
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-4">
                                        <BookOpen className="w-3.5 h-3.5" />
                                        <span>{sub.completedLessons}/{sub.totalLessons} lessons</span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                            <span>Progress</span>
                                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{sub.progressPct}%</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                                                style={{ width: `${sub.progressPct}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    {unlocked ? (
                                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors">
                                            <Play className="w-4 h-4" fill="white" />
                                            {done ? 'Review' : started ? 'Continue' : 'Start Learning'}
                                        </button>
                                    ) : (
                                        <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 text-sm font-semibold">
                                            <Lock className="w-4 h-4" />
                                            Enroll to Access
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {subjects.length === 0 && !loading && (
                    <div className="text-center py-20">
                        <p className="text-5xl mb-4">📚</p>
                        <p className="text-gray-500 dark:text-gray-400">No subjects available yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubjectSelection;
