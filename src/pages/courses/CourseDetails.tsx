import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Star, Clock, Users, CheckCircle, BookOpen, QrCode, Lock, ChevronRight, PlayCircle, ChevronDown,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { pageTransition } from '../../utils/animations';
import { courseAPI, paymentAPI } from '../../services/api';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import PaymentModal from '../../components/payment/PaymentModal';

interface Subject {
    _id: string;
    name: string;
    description?: string;
    icon?: string;
    price: number;
    originalPrice?: number;
    order: number;
    sections?: Array<{
        _id?: string;
        title: string;
        description?: string;
        order: number;
        subsections?: Array<{
            _id?: string;
            title: string;
            description?: string;
            order: number;
            content?: Array<{
                _id: string;
                type: string;
                title: string;
                description?: string;
                videoUrl?: string;
                isFree: boolean;
                duration?: string;
            }>;
        }>;
    }>;
}

interface Course {
    _id: string;
    title: string;
    description: string;
    instructor: string;
    thumbnail: string;
    price?: number;
    currency?: string;
    rating: number;
    studentsEnrolled: number;
    duration: string;
    category: string;
    grade?: string;
    medium?: string;
    paymentEnabled?: boolean;
    paymentMethod?: string;
    qrImage?: string;
    upiId?: string;
    merchantName?: string;
    paymentInstructions?: string;
    subjects?: Subject[];
    sections?: any[];
    lessons?: any[];
}

const CourseDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);

    // Course-level enrollment state
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [enrolledSubjectIds, setEnrolledSubjectIds] = useState<string[]>([]);
    const [coursePaymentStatus, setCoursePaymentStatus] = useState<string>('none'); // course-level status
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    const { addToast } = useToastStore();
    const { user } = useAuthStore();

    useEffect(() => {
        if (id) fetchCourse();
    }, [id]);

    const fetchCourse = async () => {
        try {
            setLoading(true);
            const response: any = await courseAPI.getById(id!);
            const courseData: Course = response.data;
            setCourse(courseData);

            // Pre-select subject from query param or default to first
            if (courseData.subjects && courseData.subjects.length > 0) {
                const params = new URLSearchParams(window.location.search);
                const querySubId = params.get('subjectId');
                const matched = querySubId
                    ? courseData.subjects.find((s) => s._id?.toString() === querySubId)
                    : null;
                setSelectedSubject(matched || courseData.subjects[0]);
            }

            if (user) {
                try {
                    // Get enrolled subjects (course-level enrollment returns all subjects)
                    const enrollRes: any = await courseAPI.getEnrolledSubjects(id!);
                    setEnrolledSubjectIds(enrollRes.enrolledSubjectIds || []);

                    // Get course-level payment status (one status check)
                    if (courseData.paymentEnabled) {
                        try {
                            const st: any = await paymentAPI.getStatus(id!);
                            setCoursePaymentStatus(st.status || 'none');
                        } catch {
                            setCoursePaymentStatus('none');
                        }
                    }
                } catch {
                    // Could not verify enrollment
                }
            }
        } catch (error) {
            console.error('Error fetching course:', error);
            addToast({ type: 'error', message: 'Failed to load course' });
        } finally {
            setLoading(false);
        }
    };

    const getFirstContentItem = (subject: Subject) => {
        for (const sec of subject.sections || []) {
            for (const sub of sec.subsections || []) {
                for (const item of sub.content || []) {
                    if (item._id) return item._id;
                }
            }
        }
        return null;
    };

    const isCourseEnrolled = enrolledSubjectIds.length > 0;
    const isSubjectEnrolled = (subjectId: string) => enrolledSubjectIds.includes(subjectId);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading course...</p>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Course Not Found</h1>
                    <Button onClick={() => navigate('/courses/')}>Back to Courses</Button>
                </div>
            </div>
        );
    }

    const hasSubjects = course.subjects && course.subjects.length > 0;

    return (<>
        <motion.div className="min-h-screen bg-gray-50 dark:bg-gray-950" {...pageTransition}>

            {/* ── Hero ──────────────────────────────────────────────── */}
            <div className="bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 dark:from-black dark:via-indigo-950/40 dark:to-black text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2">
                            {course.grade && (
                                <span className="inline-block mb-3 px-3 py-1 bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-sm font-medium rounded-full">
                                    Grade {course.grade}
                                </span>
                            )}
                            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{course.title}</h1>
                            <p className="text-xl mb-6 text-gray-300 leading-relaxed">{course.description}</p>

                            <div className="flex flex-wrap items-center gap-6 mb-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                    <span className="font-semibold">{course.rating}</span>
                                    <span className="text-gray-400">({course.studentsEnrolled.toLocaleString()} students)</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-300">
                                    <Clock className="w-4 h-4" />
                                    <span>{course.duration}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-300">
                                    <Users className="w-4 h-4" />
                                    <span>{course.instructor}</span>
                                </div>
                            </div>

                        {/* Enroll CTA badge */}
                            {hasSubjects && (
                                <div className="flex flex-wrap items-center gap-3 mt-4">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-sm">
                                        <BookOpen className="w-4 h-4 text-indigo-300" />
                                        <span className="text-white font-medium">{course.subjects!.length} subjects included</span>
                                    </div>
                                    {!isCourseEnrolled && course.paymentEnabled && course.price > 0 && (
                                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-sm">
                                            <span className="text-white font-bold">₹{course.price.toLocaleString()}</span>
                                            <span className="text-gray-300 text-xs">one-time</span>
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Thumbnail + Enroll Now card */}
                        <Card className="p-4 h-fit">
                            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden">
                                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="mt-4 space-y-3">
                                {isCourseEnrolled ? (
                                    <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-xl">
                                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        <div>
                                            <p className="text-sm font-semibold text-green-800 dark:text-green-300">You're Enrolled!</p>
                                            <p className="text-xs text-green-600 dark:text-green-400">All subjects are unlocked</p>
                                        </div>
                                    </div>
                                ) : coursePaymentStatus === 'pending' ? (
                                    <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 rounded-xl">
                                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">⏳ Payment Pending Verification</p>
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Usually verified within 24 hours</p>
                                    </div>
                                ) : coursePaymentStatus === 'rejected' ? (
                                    <>
                                        <div className="px-4 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl">
                                            <p className="text-xs font-semibold text-red-700 dark:text-red-300">Previous payment rejected. Please try again.</p>
                                        </div>
                                        <button
                                            onClick={() => user ? setShowPaymentModal(true) : navigate('/login/')}
                                            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg"
                                        >
                                            <QrCode className="w-5 h-5" />
                                            Try Again
                                        </button>
                                    </>
                                ) : course.paymentEnabled && course.price > 0 ? (
                                    <button
                                        onClick={() => user ? setShowPaymentModal(true) : navigate('/login/')}
                                        className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-base rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-950"
                                    >
                                        <QrCode className="w-5 h-5" />
                                        Enroll Now — ₹{course.price.toLocaleString()}
                                    </button>
                                ) : course.price === 0 || !course.paymentEnabled ? (
                                    <button
                                        onClick={() => {
                                            if (!user) { navigate('/login/'); return; }
                                            courseAPI.enroll(id!)
                                                .then(() => {
                                                    addToast({ type: 'success', message: `Enrolled in ${course.title}!` });
                                                    fetchCourse();
                                                })
                                                .catch((e: any) => addToast({ type: 'error', message: e?.message || 'Could not enroll' }));
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        Enroll Free
                                    </button>
                                ) : null}

                                {hasSubjects && (
                                    <div className="pt-2 space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Subjects included</p>
                                        {course.subjects!.map((sub) => (
                                            <div key={sub._id} className="flex items-center gap-2 py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                                <span>{sub.icon || '📚'}</span>
                                                <span className="text-sm text-gray-800 dark:text-gray-200 flex-1">{sub.name}</span>
                                                {isSubjectEnrolled(sub._id) && (
                                                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* ── Subject Tabs + Content ────────────────────────────── */}
            <div className="container mx-auto px-4 py-10">
                {hasSubjects ? (
                    <div className="grid lg:grid-cols-4 gap-8">

                    {/* Left: Subject Tab List */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 space-y-2">
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 px-1">Subjects</p>
                                {course.subjects!.map((subject) => {
                                    const enrolled = isSubjectEnrolled(subject._id);
                                    const isSelected = selectedSubject?._id === subject._id;
                                    return (
                                        <button
                                            key={subject._id}
                                            onClick={() => setSelectedSubject(subject)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all duration-200 ${
                                                isSelected
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 shadow-sm'
                                                    : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                                            }`}
                                        >
                                            <span className="text-2xl w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl flex-shrink-0">
                                                {subject.icon || '📚'}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-semibold text-sm truncate ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'}`}>
                                                    {subject.name}
                                                </p>
                                                <p className={`text-xs mt-0.5 font-medium ${
                                                    enrolled ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                                                }`}>
                                                    {enrolled ? '✓ Enrolled' : isCourseEnrolled ? '✓ Access included' : 'Enroll course to access'}
                                                </p>
                                            </div>
                                            {isSelected && <ChevronRight className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right: Selected Subject Details */}
                        <div className="lg:col-span-3">
                            <AnimatePresence mode="wait">
                                {selectedSubject && (
                                    <motion.div
                                        key={selectedSubject._id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -12 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        {/* Subject Header Card */}
                                        <Card className="p-6">
                                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-950 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                                                        {selectedSubject.icon || '📚'}
                                                    </div>
                                                    <div>
                                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedSubject.name}</h2>
                                                        {selectedSubject.description && (
                                                            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">{selectedSubject.description}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Access CTA — based on course enrollment */}
                                                <div className="flex-shrink-0">
                                                    {isSubjectEnrolled(selectedSubject._id) ? (
                                                        <button
                                                            onClick={() => {
                                                                const firstItem = getFirstContentItem(selectedSubject);
                                                                if (firstItem) navigate(`/video/${id}/${firstItem}/`);
                                                                else addToast({ type: 'info', message: 'Content coming soon!' });
                                                            }}
                                                            className="flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
                                                        >
                                                            <PlayCircle className="w-5 h-5" />
                                                            Go to Content
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => user ? setShowPaymentModal(true) : navigate('/login/')}
                                                            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg"
                                                        >
                                                            <QrCode className="w-5 h-5" />
                                                            Enroll in Course
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>

                                        {/* Subject Curriculum */}
                                        {selectedSubject.sections && selectedSubject.sections.length > 0 ? (
                                            <Card className="p-6">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                                                    <BookOpen className="w-5 h-5 text-indigo-500" />
                                                    Course Curriculum
                                                </h3>
                                                <div className="space-y-3">
                                                    {selectedSubject.sections.map((section, si) => {
                                                        const sectionKey = `${selectedSubject._id}-${si}`;
                                                        const isExpanded = expandedSections[sectionKey];
                                                        const totalItems = (section.subsections || []).reduce(
                                                            (t: number, sub: any) => t + (sub.content?.length || 0), 0
                                                        );
                                                        return (
                                                            <div key={si} className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                                                                <button
                                                                    onClick={() => setExpandedSections(prev => ({
                                                                        ...prev,
                                                                        [sectionKey]: !prev[sectionKey]
                                                                    }))}
                                                                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                                                                >
                                                                    <div>
                                                                        <p className="font-semibold text-gray-900 dark:text-white">{section.title}</p>
                                                                        {totalItems > 0 && (
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                                {totalItems} lesson{totalItems !== 1 ? 's' : ''}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                                </button>

                                                                {isExpanded && (
                                                                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                                                        {(section.subsections || []).map((subsection: any, ssi: number) => (
                                                                            <div key={ssi}>
                                                                                {subsection.title && subsection.title !== section.title && (
                                                                                    <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                                        {subsection.title}
                                                                                    </p>
                                                                                )}
                                                                                {(subsection.content || []).map((item: any, ci: number) => {
                                                                                    const enrolled = isSubjectEnrolled(selectedSubject._id);
                                                                                    const accessible = item.isFree || enrolled;
                                                                                    return (
                                                                                        <div
                                                                                            key={ci}
                                                                                            className={`flex items-center gap-3 px-4 py-3 ${accessible && enrolled ? 'hover:bg-indigo-50 dark:hover:bg-indigo-950/30 cursor-pointer' : ''} ${!accessible ? 'opacity-60' : ''}`}
                                                                                            onClick={() => {
                                                                                                if (accessible && enrolled && item._id) {
                                                                                                    navigate(`/video/${id}/${item._id}/`);
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            {accessible ? (
                                                                                                <PlayCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                                                                            ) : (
                                                                                                <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                                                            )}
                                                                                            <span className="text-sm text-gray-800 dark:text-gray-200 flex-1">{item.title}</span>
                                                                                            {item.isFree && !enrolled && (
                                                                                                <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-full font-medium">
                                                                                                    Preview
                                                                                                </span>
                                                                                            )}
                                                                                            {item.duration && (
                                                                                                <span className="text-xs text-gray-400">{item.duration}</span>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </Card>
                                        ) : (
                                            <Card className="p-8 text-center">
                                                <BookOpen className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                                <p className="text-gray-500 dark:text-gray-400 font-medium">Content will be added soon</p>
                                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                                    Enroll now to get notified when content is available.
                                                </p>
                                            </Card>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                ) : (
                    /* ── Legacy layout (course without subjects) ── */
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <Card className="p-8">
                                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">What You'll Learn</h2>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {['Master core concepts and fundamentals', 'Build real-world projects', 'Best practices', 'Advanced techniques'].map((item, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                                            <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                            {course.lessons && course.lessons.length > 0 && (
                                <Card className="p-8">
                                    <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                                        <BookOpen className="w-6 h-6" /> Course Content
                                    </h2>
                                    <div className="space-y-3">
                                        {course.lessons.map((lesson: any, index: number) => (
                                            <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 dark:text-white">{index + 1}. {lesson.title}</h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{lesson.description}</p>
                                                    </div>
                                                    <span className="text-sm text-gray-500">{lesson.duration}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}
                        </div>
                        <div>
                            <Card className="p-6">
                                <h3 className="font-bold mb-4 text-gray-900 dark:text-white">This course includes:</h3>
                                <ul className="space-y-3 text-sm">
                                    {['Video content', 'Downloadable resources', 'Lifetime access', 'Certificate of completion'].map((item) => (
                                        <li key={item} className="flex items-center gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                            <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>

        {/* Payment Modal — course-level */}
        {course && showPaymentModal && (
            <PaymentModal
                course={course as any}
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSuccess={() => {
                    setCoursePaymentStatus('pending');
                    setShowPaymentModal(false);
                    addToast({ type: 'success', message: `Payment submitted for ${course.title}! Admin will verify shortly.` });
                }}
            />
        )}
    </>);
};

export default CourseDetails;

