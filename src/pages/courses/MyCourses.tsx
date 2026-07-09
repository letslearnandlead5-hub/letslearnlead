import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Play,
    Clock,
    Award,
    TrendingUp,
    Search,
    CheckCircle,
    ChevronRight,
    Layers,
    FileText,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { staggerContainer, staggerItem } from '../../utils/animations';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';

// ─── Types ────────────────────────────────────────────────────────────────────
interface EnrolledSubjectCard {
    enrollmentId: string;
    subjectId: string;
    subjectName: string;
    subjectIcon: string;
    courseId: string;
    courseTitle: string;
    courseThumbnail: string;
    completionPercentage: number;
    totalLessons: number;
    completedLessons: number;
    firstLessonId: string;
    status: 'ongoing' | 'completed';
    enrolledAt: string;
}

// ─── Circular progress ring ────────────────────────────────────────────────────
const ProgressRing: React.FC<{ percent: number; size?: number }> = ({ percent, size = 56 }) => {
    const r = (size - 8) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;
    const isComplete = percent >= 100;
    return (
        <svg width={size} height={size} className="rotate-[-90deg]">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
                className="text-gray-200 dark:text-gray-700" strokeWidth={6} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={isComplete ? '#22c55e' : '#7c3aed'}
                strokeWidth={6} strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round" className="transition-all duration-700" />
        </svg>
    );
};

// ─── Card gradient palette ─────────────────────────────────────────────────────
const GRADIENTS = [
    'from-violet-500 to-purple-700',
    'from-blue-500 to-indigo-700',
    'from-emerald-500 to-teal-700',
    'from-rose-500 to-pink-700',
    'from-amber-500 to-orange-700',
    'from-cyan-500 to-sky-700',
];

// ─── Main Component ────────────────────────────────────────────────────────────
const MyCourses: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');
    const [subjects, setSubjects] = useState<EnrolledSubjectCard[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { addToast } = useToastStore();
    const { token } = useAuthStore();

    useEffect(() => {
        fetchEnrolledSubjects();
    }, []);

    const fetchEnrolledSubjects = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${API_URL}/api/enrollment/my-enrollments`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch enrollments');
            const data = await res.json();
            const enrollments: any[] = data.data || [];

            const cards: EnrolledSubjectCard[] = enrollments
                .filter((e: any) => e.courseId)
                .map((e: any) => {
                    const course = e.courseId;
                    const subjectData = course.subjects?.find(
                        (s: any) => s._id?.toString() === e.subjectId?.toString()
                    );

                    let totalLessons = 0;
                    let firstLessonId = '';
                    for (const section of subjectData?.sections || []) {
                        for (const subsection of section.subsections || []) {
                            for (const item of subsection.content || []) {
                                if (!firstLessonId && item._id) firstLessonId = item._id.toString();
                                totalLessons++;
                            }
                        }
                    }

                    const pct = Math.round(e.completionPercentage || 0);
                    return {
                        enrollmentId: e._id || `${course._id}-${e.subjectId}`,
                        subjectId: e.subjectId || '',
                        subjectName: e.subjectName || subjectData?.name || 'Unknown Subject',
                        subjectIcon: subjectData?.icon || '📚',
                        courseId: course._id,
                        courseTitle: course.title || 'Unknown Course',
                        courseThumbnail: course.thumbnail || '',
                        completionPercentage: pct,
                        totalLessons,
                        completedLessons: Math.floor((pct / 100) * totalLessons),
                        firstLessonId,
                        status: pct >= 100 ? 'completed' : 'ongoing',
                        enrolledAt: e.createdAt || new Date().toISOString(),
                    } as EnrolledSubjectCard;
                });

            setSubjects(cards);
        } catch (err) {
            console.error(err);
            addToast({ type: 'error', message: 'Failed to load your subjects' });
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = (card: EnrolledSubjectCard) => {
        if (card.firstLessonId) {
            navigate(`/video/${card.courseId}/${card.firstLessonId}/`);
            return;
        }

        navigate(`/courses/${card.courseId}/?subjectId=${card.subjectId}`);
    };

    const handleViewNotes = (card: EnrolledSubjectCard) => {
        navigate(`/dashboard/?tab=subject-notes&subjectId=${card.subjectId}`);
    };

    const filtered = subjects.filter((s) => {
        const matchSearch =
            s.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.courseTitle.toLowerCase().includes(searchTerm.toLowerCase());
        const matchFilter =
            filter === 'all' ||
            (filter === 'in-progress' && s.status === 'ongoing') ||
            (filter === 'completed' && s.status === 'completed');
        return matchSearch && matchFilter;
    });

    const stats = {
        total: subjects.length,
        inProgress: subjects.filter((s) => s.status === 'ongoing').length,
        completed: subjects.filter((s) => s.status === 'completed').length,
        avgProgress:
            subjects.length > 0
                ? Math.round(subjects.reduce((a, s) => a + s.completionPercentage, 0) / subjects.length)
                : 0,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
            <div className="container mx-auto px-4 max-w-6xl">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">My Subjects</h1>
                    <p className="text-gray-500 dark:text-gray-400">Continue learning your enrolled subjects</p>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                >
                    {[
                        { label: 'Total Subjects', value: stats.total, icon: <Layers className="w-5 h-5" />, color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/40' },
                        { label: 'In Progress', value: stats.inProgress, icon: <TrendingUp className="w-5 h-5" />, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40' },
                        { label: 'Completed', value: stats.completed, icon: <Award className="w-5 h-5" />, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40' },
                        { label: 'Avg Progress', value: `${stats.avgProgress}%`, icon: <CheckCircle className="w-5 h-5" />, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/40' },
                    ].map((stat) => (
                        <Card key={stat.label} className="p-5 flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${stat.color}`}>{stat.icon}</div>
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                            </div>
                        </Card>
                    ))}
                </motion.div>

                {/* Search + Filter */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                    className="flex flex-col sm:flex-row gap-3 mb-8"
                >
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search subjects or courses..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                        />
                    </div>
                    <div className="flex gap-2 shrink-0">
                        {(['all', 'in-progress', 'completed'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${filter === f
                                        ? 'bg-violet-600 text-white shadow-md'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {f === 'all' ? 'All' : f === 'in-progress' ? 'In Progress' : 'Completed'}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Subject Cards */}
                {filtered.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="text-center py-24 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800"
                    >
                        <div className="w-20 h-20 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
                            <BookOpen className="w-10 h-10 text-violet-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {searchTerm || filter !== 'all' ? 'No subjects match your search' : 'No subjects enrolled yet'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
                            {searchTerm || filter !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'Browse our courses and enroll in subjects to start learning'}
                        </p>
                        {!searchTerm && filter === 'all' && (
                            <Button variant="primary" className="mt-6 bg-violet-600 hover:bg-violet-700"
                                onClick={() => navigate('/courses/')}>
                                Browse Courses
                            </Button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filtered.map((card, idx) => {
                            const grad = GRADIENTS[idx % GRADIENTS.length];
                            const isComplete = card.status === 'completed';
                            return (
                                <motion.div key={card.enrollmentId} variants={staggerItem} whileHover={{ y: -6 }}>
                                    <div
                                        onClick={() => handleContinue(card)}
                                        className="rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex flex-col h-full group cursor-pointer"
                                    >
                                        {/* Gradient header */}
                                        <div className={`relative h-28 bg-gradient-to-br ${grad} flex items-center px-6 overflow-hidden`}>
                                            {card.courseThumbnail && (
                                                <img src={card.courseThumbnail} alt="" aria-hidden
                                                    className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay" />
                                            )}
                                            <div className="relative z-10 text-5xl select-none drop-shadow-lg">
                                                {card.subjectIcon}
                                            </div>
                                            <div className="absolute top-3 right-3 z-10">
                                                {isComplete ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white">
                                                        <CheckCircle className="w-3 h-3" /> Completed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm">
                                                        <Play className="w-3 h-3" fill="white" /> Ongoing
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Body */}
                                        <div className="p-5 flex flex-col flex-1">
                                            <div className="mb-3">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                                    {card.subjectName}
                                                </h3>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">
                                                    {card.courseTitle}
                                                </p>
                                            </div>

                                            {/* Progress ring + meta */}
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="relative shrink-0">
                                                    <ProgressRing percent={card.completionPercentage} size={56} />
                                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300">
                                                        {card.completionPercentage}%
                                                    </span>
                                                </div>
                                                <div className="flex-1 space-y-1.5">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                        <BookOpen className="w-3.5 h-3.5 shrink-0" />
                                                        <span>{card.completedLessons}/{card.totalLessons || '—'} lessons</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                        <Clock className="w-3.5 h-3.5 shrink-0" />
                                                        <span>
                                                            Enrolled {new Date(card.enrolledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-4">
                                                <div
                                                    className={`h-1.5 rounded-full transition-all duration-700 ${isComplete ? 'bg-emerald-500' : 'bg-violet-500'}`}
                                                    style={{ width: `${card.completionPercentage}%` }}
                                                />
                                            </div>

                                            {/* Action buttons */}
                                            <div className="mt-auto grid grid-cols-1 gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleContinue(card); }}
                                                    className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200
                                                    ${isComplete
                                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
                                                            : 'bg-violet-600 text-white hover:bg-violet-700 shadow-md hover:shadow-violet-500/30'
                                                        }`}
                                                >
                                                    {isComplete ? (
                                                        <><CheckCircle className="w-4 h-4" /> Review Subject</>
                                                    ) : (
                                                        <><Play className="w-4 h-4" fill="white" /> Continue Learning <ChevronRight className="w-4 h-4 ml-auto" /></>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleViewNotes(card); }}
                                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 bg-white dark:bg-gray-800 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    View Notes
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default MyCourses;
