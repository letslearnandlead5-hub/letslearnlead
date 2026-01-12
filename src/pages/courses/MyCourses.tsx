import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Play,
    Clock,
    Award,
    TrendingUp,
    Search,
    FileText,
    Brain,
    Video,
    Download,
    CheckCircle,
    Eye
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { staggerContainer, staggerItem } from '../../utils/animations';
import { courseAPI, noteAPI } from '../../services/api';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import MarkdownViewer from '../../components/notes/MarkdownViewer';

interface EnrolledCourse {
    _id: string;
    title: string;
    thumbnail: string;
    instructor: string;
    progress: number;
    totalLessons: number;
    completedLessons: number;
    nextLesson: string;
    firstLessonId: string; // Added for navigation
    category: string;
    enrolledDate: string;
    duration: string;
    level: string;
    status: 'ongoing' | 'completed';
    hasQuizzes: boolean;
    hasAssignments: boolean;
}

const MyCourses: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');
    const [courses, setCourses] = useState<EnrolledCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState<EnrolledCourse | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [courseMaterials, setCourseMaterials] = useState<any[]>([]);
    const [selectedNote, setSelectedNote] = useState<any>(null);
    const [isNoteViewerOpen, setIsNoteViewerOpen] = useState(false);
    const { addToast } = useToastStore();
    const { token } = useAuthStore();

    useEffect(() => {
        fetchEnrolledCourses();
    }, []);

    const fetchEnrolledCourses = async () => {
        try {
            // Fetch enrollments with progress data
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const enrollmentsResponse = await fetch(`${API_URL}/api/enrollment/my-enrollments`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!enrollmentsResponse.ok) {
                throw new Error('Failed to fetch enrollments');
            }

            const enrollmentsData = await enrollmentsResponse.json();
            const enrollments = enrollmentsData.data || [];

            // Transform enrollments to include real progress
            const transformedCourses = enrollments.map((enrollment: any) => {
                const course = enrollment.courseId;
                const completionPercentage = enrollment.completionPercentage || 0;

                // Calculate total lessons from sections structure
                let totalLessons = 0;
                let firstLessonId = '';

                if (course?.sections) {
                    for (const section of course.sections) {
                        for (const subsection of section.subsections || []) {
                            for (const item of subsection.content || []) {
                                if (!firstLessonId && item._id) {
                                    firstLessonId = item._id;
                                }
                                totalLessons++;
                            }
                        }
                    }
                }

                const completedLessons = Math.floor((completionPercentage / 100) * totalLessons);

                return {
                    _id: course?._id || enrollment._id,
                    title: course?.title || 'Unknown Course',
                    thumbnail: course?.thumbnail || '',
                    instructor: course?.instructor || 'Unknown',
                    progress: completionPercentage,
                    totalLessons,
                    completedLessons,
                    nextLesson: completedLessons < totalLessons ? 'Continue Learning' : 'Course Complete',
                    firstLessonId: firstLessonId || '',
                    category: course?.category || '',
                    enrolledDate: enrollment.createdAt || new Date().toISOString(),
                    duration: course?.duration || '0 hours',
                    level: course?.level || 'beginner',
                    status: (completionPercentage >= 100 ? 'completed' : completionPercentage > 0 ? 'ongoing' : 'ongoing') as 'ongoing' | 'completed',
                    hasQuizzes: !!course?.quizId,
                    hasAssignments: false,
                };
            });

            setCourses(transformedCourses);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching enrollments:', error);
            addToast({ type: 'error', message: 'Failed to load courses' });
            setLoading(false);
        }
    };

    const fetchCourseMaterials = async (courseId: string) => {
        try {
            const response = await noteAPI.getByCourse(courseId);
            setCourseMaterials(response.data || []);
        } catch (error) {
            console.error('Error fetching materials:', error);
        }
    };

    const handleViewDetails = (course: EnrolledCourse) => {
        setSelectedCourse(course);
        fetchCourseMaterials(course._id);
        setIsDetailsOpen(true);
    };

    const filteredCourses = courses.filter((course) => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter =
            filter === 'all' ||
            (filter === 'in-progress' && course.progress > 0 && course.progress < 100) ||
            (filter === 'completed' && course.progress >= 100);
        return matchesSearch && matchesFilter;
    });

    const stats = {
        total: courses.length,
        inProgress: courses.filter((c) => c.progress < 100).length,
        completed: courses.filter((c) => c.progress === 100).length,
        totalHours: courses.reduce((sum, c) => sum + c.totalLessons, 0) * 0.5,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">My Courses</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Continue your learning journey
                    </p>
                </div>

                {/* Stats */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <Card className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Total Courses</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</div>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                                <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</div>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Total Hours</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalHours}</div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search your courses..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={filter === 'all' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('all')}
                            >
                                All
                            </Button>
                            <Button
                                variant={filter === 'in-progress' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('in-progress')}
                            >
                                In Progress
                            </Button>
                            <Button
                                variant={filter === 'completed' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('completed')}
                            >
                                Completed
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Browse More Courses Button */}
                <div className="mb-6">
                    <Link to="/courses">
                        <Button variant="primary" className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700" leftIcon={<BookOpen className="w-5 h-5" />}>
                            Browse All Courses
                        </Button>
                    </Link>
                </div>

                {/* Courses Grid */}
                <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {filteredCourses.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-lg">No courses found</p>
                            <Link to="/courses">
                                <Button variant="primary" className="mt-4">
                                    Browse Courses
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        filteredCourses.map((course) => (
                            <motion.div key={course._id} variants={staggerItem}>
                                <Card className="overflow-hidden hover:shadow-xl transition-shadow">
                                    <div className="relative">
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-full h-48 object-cover"
                                        />
                                        <Badge
                                            variant={course.status === 'completed' ? 'success' : 'warning'}
                                            className="absolute top-3 right-3"
                                        >
                                            {course.status === 'completed' ? 'Completed' : 'Ongoing'}
                                        </Badge>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="secondary">
                                                {course.category}
                                            </Badge>
                                            <Badge variant="primary">
                                                {course.level}
                                            </Badge>
                                        </div>
                                        <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            by {course.instructor}
                                        </p>

                                        {/* Course Info */}
                                        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                <span>{course.duration}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Video className="w-4 h-4" />
                                                <span>{course.totalLessons} lessons</span>
                                            </div>
                                        </div>

                                        {/* Progress */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    Progress
                                                </span>
                                                <span className="text-sm font-semibold">{course.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-primary-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${course.progress}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {course.completedLessons} of {course.totalLessons} lessons completed
                                            </p>
                                        </div>

                                        {/* Quick Access Icons */}
                                        <div className="flex items-center gap-2 mb-4">
                                            {course.hasQuizzes && (
                                                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                                    <Brain className="w-4 h-4 text-blue-600" />
                                                    <span>Quizzes</span>
                                                </div>
                                            )}
                                            {course.hasAssignments && (
                                                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                                    <FileText className="w-4 h-4 text-green-600" />
                                                    <span>Assignments</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                                <Download className="w-4 h-4 text-purple-600" />
                                                <span>Materials</span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            <Link
                                                to={course.firstLessonId ? `/video/${course._id}/${course.firstLessonId}` : `/courses/${course._id}`}
                                                className="flex-1"
                                            >
                                                <Button
                                                    variant="primary"
                                                    className="w-full"
                                                    leftIcon={<Play className="w-4 h-4" />}
                                                >
                                                    {course.status === 'completed' ? 'Review' : 'Continue'}
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewDetails(course)}
                                            >
                                                <FileText className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </motion.div>
            </div>

            {/* Course Details Modal */}
            <Modal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                title="Course Resources"
                size="lg"
            >
                {selectedCourse && (
                    <div className="p-6">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {selectedCourse.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                by {selectedCourse.instructor}
                            </p>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Video className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Lessons
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-blue-600">
                                    {selectedCourse.completedLessons}/{selectedCourse.totalLessons}
                                </p>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Progress
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-green-600">
                                    {selectedCourse.progress}%
                                </p>
                            </div>
                            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Duration
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-purple-600">
                                    {selectedCourse.duration}
                                </p>
                            </div>
                        </div>

                        {/* Study Materials */}
                        <div className="mb-6">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <Download className="w-5 h-5" />
                                Study Materials
                            </h4>
                            {courseMaterials.length === 0 ? (
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    No materials available yet
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {courseMaterials.map((material) => (
                                        <div
                                            key={material._id}
                                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-5 h-5 text-primary-600" />
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {material.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {material.fileType?.toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        // Check if HTML note or file-based note
                                                        if (material.fileType === 'html' && material.markdownContent) {
                                                            // Open HTML note in modal
                                                            setSelectedNote(material);
                                                            setIsNoteViewerOpen(true);
                                                        } else if (material.fileUrl) {
                                                            // Open file in new tab
                                                            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                                                            window.open(`${baseUrl}${material.fileUrl}`, '_blank');
                                                        }
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                {material.fileUrl ? (
                                                    <a
                                                        href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${material.fileUrl}`}
                                                        download
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <Button variant="outline" size="sm">
                                                            <Download className="w-4 h-4" />
                                                        </Button>
                                                    </a>
                                                ) : material.fileType === 'html' && material.markdownContent ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            // Parse markdown content to HTML (same as MarkdownViewer)
                                                            const parseMarkdown = (text: string) => {
                                                                if (!text) return '';
                                                                let html = text;

                                                                // Headers
                                                                html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
                                                                html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
                                                                html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

                                                                // Bold
                                                                html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

                                                                // Italic
                                                                html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

                                                                // Links
                                                                html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>');

                                                                // Code blocks
                                                                html = html.replace(/```(.*?)```/gis, '<pre><code>$1</code></pre>');

                                                                // Inline code
                                                                html = html.replace(/`(.*?)`/gim, '<code>$1</code>');

                                                                // Lists - wrap consecutive li items in ul
                                                                html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
                                                                html = html.replace(/^- (.*$)/gim, '<li>$1</li>');

                                                                // Wrap consecutive <li> in <ul>
                                                                html = html.replace(/(<li>.*?<\/li>\s*)+/gis, '<ul>$&</ul>');

                                                                // Line breaks
                                                                html = html.replace(/\n/gim, '<br />');

                                                                return html;
                                                            };

                                                            const parsedContent = parseMarkdown(material.markdownContent);

                                                            // Create HTML file from parsed content
                                                            const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${material.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #333;
            background: #fff;
        }
        h1, h2, h3, h4, h5, h6 { 
            margin-top: 24px; 
            margin-bottom: 16px; 
            font-weight: 600; 
            line-height: 1.25;
        }
        h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
        h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
        h3 { font-size: 1.25em; }
        h4 { font-size: 1em; }
        p { margin: 16px 0; }
        ul, ol { 
            margin: 16px 0; 
            padding-left: 32px;
        }
        li { 
            margin: 8px 0;
            line-height: 1.6;
        }
        li > p {
            margin: 4px 0;
        }
        code { 
            background: #f6f8fa; 
            padding: 2px 6px; 
            border-radius: 3px; 
            font-family: 'Courier New', Courier, monospace;
            font-size: 0.9em;
        }
        pre { 
            background: #f6f8fa; 
            padding: 16px; 
            border-radius: 6px; 
            overflow-x: auto;
            margin: 16px 0;
        }
        pre code { 
            background: none; 
            padding: 0; 
        }
        table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 16px 0; 
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 8px 12px; 
            text-align: left; 
        }
        th { 
            background: #f6f8fa; 
            font-weight: 600; 
        }
        blockquote { 
            border-left: 4px solid #ddd; 
            padding-left: 16px; 
            color: #666; 
            margin: 16px 0;
            font-style: italic;
        }
        img { 
            max-width: 100%; 
            height: auto; 
            margin: 16px 0;
        }
        strong { font-weight: 600; }
        em { font-style: italic; }
        hr { 
            border: none; 
            border-top: 2px solid #eee; 
            margin: 24px 0; 
        }
        a { 
            color: #0366d6; 
            text-decoration: none; 
        }
        a:hover { 
            text-decoration: underline; 
        }
    </style>
</head>
<body>
    <h1>${material.title}</h1>
    <div class="content">${parsedContent}</div>
</body>
</html>`;
                                                            const blob = new Blob([htmlContent], { type: 'text/html' });
                                                            const url = URL.createObjectURL(blob);
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = `${material.title.replace(/[^a-z0-9]/gi, '_')}.html`;
                                                            document.body.appendChild(a);
                                                            a.click();
                                                            document.body.removeChild(a);
                                                            URL.revokeObjectURL(url);
                                                        }}
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quizzes & Assignments */}
                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                            {selectedCourse.hasQuizzes && (
                                <div className="p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Brain className="w-5 h-5 text-blue-600" />
                                        <h5 className="font-semibold text-gray-900 dark:text-white">
                                            Quizzes Available
                                        </h5>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        Test your knowledge with course quizzes
                                    </p>
                                    <Link to="/dashboard">
                                        <Button variant="primary" size="sm" className="w-full">
                                            Take Quiz
                                        </Button>
                                    </Link>
                                </div>
                            )}
                            {selectedCourse.hasAssignments && (
                                <div className="p-4 border-2 border-green-200 dark:border-green-800 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-5 h-5 text-green-600" />
                                        <h5 className="font-semibold text-gray-900 dark:text-white">
                                            Assignments
                                        </h5>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        Complete assignments to practice
                                    </p>
                                    <Button variant="primary" size="sm" className="w-full">
                                        View Assignments
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsDetailsOpen(false)}
                                className="flex-1"
                            >
                                Close
                            </Button>
                            <Link
                                to={selectedCourse.firstLessonId ? `/video/${selectedCourse._id}/${selectedCourse.firstLessonId}` : `/courses/${selectedCourse._id}`}
                                className="flex-1"
                            >
                                <Button variant="primary" className="w-full">
                                    {selectedCourse.status === 'completed' ? 'Review Course' : 'Continue Learning'}
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Note Viewer Modal for HTML Notes */}
            <Modal
                isOpen={isNoteViewerOpen}
                onClose={() => setIsNoteViewerOpen(false)}
                title={selectedNote?.title || 'Note'}
                size="full"
            >
                {selectedNote?.markdownContent && (
                    <div className="p-6">
                        <MarkdownViewer content={selectedNote.markdownContent} />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MyCourses;
