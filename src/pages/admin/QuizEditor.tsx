import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Save,
    X,
    Plus,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Send,
    BookOpen,
    Users,
    FileText,
    MessageSquare,
    Brain,
    Settings,
    LogOut,
    BarChart3,
    FileQuestion,
    Image,
    ArrowLeftRight,
    Upload,
    Eye,
} from 'lucide-react';
import { createQuiz, getQuizById, updateQuiz } from '../../services/quizService';
import type { Quiz, QuizQuestion, QuestionOption, MatchPair, Subject } from '../../types';
import toast from 'react-hot-toast';
import AdminHeader from '../../components/admin/AdminHeader';
import { useAuthStore } from '../../store/useAuthStore';
import ScientificEditor, { stripHtml } from '../../components/quiz/ScientificEditor';
import RichTextDisplay from '../../components/quiz/RichTextDisplay';
import LivePreview from '../../components/quiz/LivePreview';
import { generatePairId, normalizeMatchPairs } from '../../utils/htmlUtils';

// ── Image compression helper (same approach as CourseEditor) ─────────────────
const compressImage = (file: File, maxW = 900, maxH = 700, quality = 0.82): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                if (width > maxW || height > maxH) {
                    const ratio = Math.min(maxW / width, maxH / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = reader.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

const QuizEditor: React.FC = () => {
    const { id: quizId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { logout } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [courses, setCourses] = useState<any[]>([]);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Quiz basic info
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [courseId, setCourseId] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [subjectName, setSubjectName] = useState('');

    // Derive subjects for the selected course
    const selectedCourseSubjects: Subject[] = courses.find(c => c._id === courseId)?.subjects || [];

    // Quiz settings
    const [marksPerQuestion, setMarksPerQuestion] = useState(1);
    const [negativeMarking, setNegativeMarking] = useState(0);
    const [timeLimit, setTimeLimit] = useState(30);
    const [passingPercentage, setPassingPercentage] = useState(40);
    const [allowRetake, setAllowRetake] = useState(false);
    const [maxAttempts, setMaxAttempts] = useState(1);

    // Questions
    const [questions, setQuestions] = useState<Partial<QuizQuestion>[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        fetchCourses();
        if (quizId) {
            loadQuiz();
        } else {
            addQuestion();
        }
    }, [quizId]);

    const fetchCourses = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${API_URL}/api/courses`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            const data = await response.json();
            setCourses(data.data || []);
        } catch (error) {
            toast.error('Failed to load courses');
        }
    };

    const loadQuiz = async () => {
        if (!quizId) return;
        try {
            setLoading(true);
            const data = await getQuizById(quizId, true);
            const quiz = data.quiz || data;
            setTitle(quiz.title);
            setDescription(quiz.description);
            setCourseId(quiz.courseId);
            setSubjectId(quiz.subjectId || '');
            setSubjectName(quiz.subjectName || '');
            setMarksPerQuestion(quiz.settings.marksPerQuestion);
            setNegativeMarking(quiz.settings.negativeMarking);
            setTimeLimit(quiz.settings.timeLimit);
            setPassingPercentage(quiz.settings.passingPercentage || 40);
            setAllowRetake(quiz.settings.allowRetake || false);
            setMaxAttempts(quiz.settings.maxAttempts || 1);
            setQuestions(quiz.questions || []);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load quiz');
            navigate('/dashboard/');
        } finally {
            setLoading(false);
        }
    };

    // ── Question management ──────────────────────────────────────────────────

    const buildBlankQuestion = (): Partial<QuizQuestion> => ({
        questionType: 'text',
        questionText: '',
        questionImage: '',
        options: [
            { id: '1', text: '' },
            { id: '2', text: '' },
            { id: '3', text: '' },
            { id: '4', text: '' },
        ],
        correctAnswer: '',
        matchPairs: [
            { id: generatePairId(), left: '', right: '', order: 0 },
            { id: generatePairId(), left: '', right: '', order: 1 },
        ],
        explanation: '',
        marks: marksPerQuestion,
        negativeMarks: negativeMarking,
        order: questions.length,
    });

    const addQuestion = () => {
        const newQuestion = buildBlankQuestion();
        setQuestions(prev => [...prev, newQuestion]);
        setCurrentQuestionIndex(prev => prev + (questions.length > 0 ? 0 : 0));
        // navigate to the new question
        setTimeout(() => setCurrentQuestionIndex(questions.length), 0);
    };

    const removeQuestion = (index: number) => {
        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);
        if (currentQuestionIndex >= newQuestions.length && currentQuestionIndex > 0) {
            setCurrentQuestionIndex(newQuestions.length - 1);
        }
    };

    const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
        setQuestions(prev => {
            const copy = [...prev];
            copy[index] = { ...copy[index], ...updates };
            return copy;
        });
    };

    // Change question type — reset type-specific fields
    const changeQuestionType = (index: number, newType: QuizQuestion['questionType']) => {
        updateQuestion(index, {
            questionType: newType,
            // Reset type-specific data when switching
            ...(newType === 'match'
                ? { options: [], correctAnswer: '', matchPairs: [
                    { id: generatePairId(), left: '', right: '', order: 0 },
                    { id: generatePairId(), left: '', right: '', order: 1 },
                  ] }
                : { matchPairs: [], options: questions[index]?.options?.length ? questions[index].options : [{ id: '1', text: '' }, { id: '2', text: '' }, { id: '3', text: '' }, { id: '4', text: '' }] }
            ),
        });
    };

    // ── MCQ option management ────────────────────────────────────────────────

    const addOption = (questionIndex: number) => {
        const question = questions[questionIndex];
        if (!question.options || question.options.length >= 6) {
            toast.error('Maximum 6 options allowed');
            return;
        }
        const newOption: QuestionOption = { id: String(Date.now()), text: '' };
        updateQuestion(questionIndex, { options: [...question.options, newOption] });
    };

    const removeOption = (questionIndex: number, optionId: string) => {
        const question = questions[questionIndex];
        if (!question.options || question.options.length <= 2) {
            toast.error('Minimum 2 options required');
            return;
        }
        const newOptions = question.options.filter(opt => opt.id !== optionId);
        const updates: Partial<QuizQuestion> = { options: newOptions };
        if (question.correctAnswer === optionId) updates.correctAnswer = '';
        updateQuestion(questionIndex, updates);
    };

    const updateOption = (questionIndex: number, optionId: string, text: string) => {
        const question = questions[questionIndex];
        if (!question.options) return;
        updateQuestion(questionIndex, {
            options: question.options.map(opt => (opt.id === optionId ? { ...opt, text } : opt)),
        });
    };

    // ── Match pair management ────────────────────────────────────────────────

    const addMatchPair = (questionIndex: number) => {
        const question = questions[questionIndex];
        const pairs = question.matchPairs || [];
        if (pairs.length >= 8) { toast.error('Maximum 8 pairs allowed'); return; }
        const newPair: MatchPair = {
            id: generatePairId(),
            left: '',
            right: '',
            order: pairs.length,
        };
        updateQuestion(questionIndex, { matchPairs: [...pairs, newPair] });
    };

    const removeMatchPair = (questionIndex: number, pairIndex: number) => {
        const question = questions[questionIndex];
        const pairs = question.matchPairs || [];
        if (pairs.length <= 2) { toast.error('Minimum 2 pairs required'); return; }
        updateQuestion(questionIndex, { matchPairs: pairs.filter((_, i) => i !== pairIndex) });
    };

    const updateMatchPair = (questionIndex: number, pairIndex: number, side: 'left' | 'right', value: string) => {
        const question = questions[questionIndex];
        const pairs = [...(question.matchPairs || [])];
        // Preserve existing id/order, only update the changed side
        pairs[pairIndex] = { ...pairs[pairIndex], [side]: value };
        updateQuestion(questionIndex, { matchPairs: pairs });
    };

    // ── Image upload ─────────────────────────────────────────────────────────

    const handleQuestionImageUpload = async (questionIndex: number, file: File) => {
        if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
            toast.error('Please upload a JPEG, PNG, GIF or WebP image');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB');
            return;
        }
        try {
            const compressed = await compressImage(file);
            updateQuestion(questionIndex, { questionImage: compressed });
        } catch {
            toast.error('Failed to process image');
        }
    };

    // ── Validation ───────────────────────────────────────────────────────────

    const validateStep = (stepNum: number): boolean => {
        switch (stepNum) {
            case 1:
                if (!title.trim()) { toast.error('Quiz title is required'); return false; }
                if (!description.trim()) { toast.error('Quiz description is required'); return false; }
                if (!courseId) { toast.error('Please select a course'); return false; }
                return true;

            case 2:
                if (marksPerQuestion <= 0) { toast.error('Marks per question must be greater than 0'); return false; }
                if (timeLimit <= 0) { toast.error('Time limit must be greater than 0'); return false; }
                return true;

            case 3:
                if (questions.length === 0) { toast.error('Add at least one question'); return false; }
                for (let i = 0; i < questions.length; i++) {
                    const q = questions[i];
                    
                    const isTextEmpty = (html: string | undefined) => {
                        if (!html) return true;
                        if (html.includes('<img')) return false;
                        return !stripHtml(html);
                    };

                    if (isTextEmpty(q.questionText)) { toast.error(`Question ${i + 1}: Question text is required`); return false; }

                    if (q.questionType === 'match') {
                        const pairs = q.matchPairs || [];
                        if (pairs.length < 2) { toast.error(`Question ${i + 1}: At least 2 match pairs required`); return false; }
                        if (pairs.some(p => isTextEmpty(p.left) || isTextEmpty(p.right))) {
                            toast.error(`Question ${i + 1}: All match pairs must have both left and right text`);
                            return false;
                        }
                    } else {
                        if (!q.options || q.options.length < 2) { toast.error(`Question ${i + 1}: At least 2 options required`); return false; }
                        if (q.options.some(opt => isTextEmpty(opt.text))) { toast.error(`Question ${i + 1}: All options must have text`); return false; }
                        if (!q.correctAnswer) { toast.error(`Question ${i + 1}: Please select the correct answer`); return false; }
                    }

                    if (isTextEmpty(q.explanation)) { toast.error(`Question ${i + 1}: Explanation is required`); return false; }
                }
                return true;

            default:
                return true;
        }
    };

    const handleNext = () => {
        if (validateStep(step)) setStep(step + 1);
    };

    const handleSave = async (publish: boolean = false) => {
        if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

        try {
            setLoading(true);
            const quizData: Partial<Quiz> = {
                title,
                description,
                courseId,
                subjectId: subjectId || undefined,
                subjectName: subjectName || undefined,
                settings: { marksPerQuestion, negativeMarking, timeLimit, passingPercentage, allowRetake, maxAttempts },
                // Normalize match pairs before saving — assigns stable IDs, cleans HTML, assigns order
                questions: (questions as QuizQuestion[]).map((q) => ({
                    ...q,
                    matchPairs: q.questionType === 'match'
                        ? normalizeMatchPairs(q.matchPairs || [])
                        : [],
                })),
                isPublished: publish,
            };

            if (quizId) {
                await updateQuiz(quizId, quizData);
                toast.success('Quiz updated successfully');
            } else {
                const newQuiz = await createQuiz(quizData);
                toast.success('Quiz created successfully');
                if (publish) {
                    navigate('/dashboard/');
                } else {
                    navigate(`/admin/quizzes/edit/${newQuiz._id}/`);
                }
                return;
            }
            navigate('/dashboard/');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save quiz');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/login/');
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'students', label: 'Students', icon: Users },
        { id: 'courses', label: 'Courses', icon: BookOpen },
        { id: 'notes', label: 'Notes', icon: FileText },
        { id: 'quizzes', label: 'Quizzes', icon: FileQuestion },
        { id: 'doubts', label: 'Student Doubts', icon: MessageSquare },
        { id: 'notifications', label: 'Notifications', icon: Brain },
    ];

    const currentQuestion = questions[currentQuestionIndex];

    if (loading && quizId) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                <AdminHeader onMenuClick={() => setShowMobileSidebar(true)} />
                <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <AdminHeader onMenuClick={() => setShowMobileSidebar(true)} />

            <div className="flex">
                {/* Sidebar */}
                <div className={`fixed lg:sticky top-20 inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 h-[calc(100vh-5rem)] border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                    <div className="p-6 flex-shrink-0 border-b border-gray-200 dark:border-gray-800 lg:hidden">
                        <div className="flex items-center justify-end">
                            <button onClick={() => setShowMobileSidebar(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <nav className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    if (tab.id === 'quizzes') { navigate('/admin/quizzes/'); setShowMobileSidebar(false); }
                                    else { window.dispatchEvent(new CustomEvent('selectAdminTab', { detail: tab.id })); navigate('/dashboard/'); setShowMobileSidebar(false); }
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${tab.id === 'quizzes' ? 'bg-blue-100 dark:bg-blue-950 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                        <button onClick={() => { window.dispatchEvent(new CustomEvent('selectAdminTab', { detail: 'settings' })); navigate('/dashboard/'); setShowMobileSidebar(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mt-6 hover:bg-gray-100 dark:hover:bg-gray-800">
                            <Settings className="w-5 h-5" />
                            <span className="font-medium">Settings</span>
                        </button>
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 transition-colors">
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Logout</span>
                        </button>
                    </nav>
                </div>

                {showMobileSidebar && (
                    <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowMobileSidebar(false)}></div>
                )}

                <div className="flex-1 flex flex-col h-[calc(100vh-5rem)] overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        <div className="max-w-5xl mx-auto">

                            {/* Header */}
                            <div className="mb-8">
                                <button onClick={() => navigate('/admin/quizzes/')} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4">
                                    <ChevronLeft className="w-5 h-5" />
                                    Back to Quizzes
                                </button>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {quizId ? 'Edit Quiz' : 'Create Quiz'}
                                </h1>
                            </div>

                            {/* Progress Steps */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between">
                                    {['Basic Info', 'Settings', 'Questions', 'Review'].map((label, index) => (
                                        <div key={index} className={`flex-1 ${index < 3 ? 'mr-2' : ''}`}>
                                            <div className={`flex items-center ${step > index + 1 ? 'text-green-600' : step === index + 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step > index + 1 ? 'bg-green-100 dark:bg-green-900' : step === index + 1 ? 'bg-indigo-100 dark:bg-indigo-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                                    {index + 1}
                                                </div>
                                                <span className="ml-2 text-sm font-medium hidden sm:block">{label}</span>
                                            </div>
                                            {index < 3 && (<div className={`h-1 mt-2 rounded ${step > index + 1 ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}`} />)}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Step Content */}
                            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">

                                {/* ── Step 1: Basic Info ── */}
                                {step === 1 && (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quiz Title *</label>
                                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" placeholder="Enter quiz title" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" placeholder="Enter quiz description" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course *</label>
                                            <select
                                                value={courseId}
                                                onChange={(e) => {
                                                    setCourseId(e.target.value);
                                                    setSubjectId('');
                                                    setSubjectName('');
                                                }}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="">Select a course</option>
                                                {courses.map((course) => (<option key={course._id} value={course._id}>{course.title}</option>))}
                                            </select>
                                        </div>
                                        {/* Subject Selection */}
                                        {selectedCourseSubjects.length > 0 && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject (Optional)</label>
                                                <select
                                                    value={subjectId}
                                                    onChange={(e) => {
                                                        const s = selectedCourseSubjects.find(sub => sub._id === e.target.value);
                                                        setSubjectId(e.target.value);
                                                        setSubjectName(s?.name || '');
                                                    }}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                                >
                                                    <option value="">All subjects (general quiz)</option>
                                                    {selectedCourseSubjects.map((sub) => (
                                                        <option key={sub._id} value={sub._id}>
                                                            {sub.icon ? `${sub.icon} ` : ''}{sub.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Step 2: Settings ── */}
                                {step === 2 && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Marks per Question *</label>
                                                <input type="number" value={marksPerQuestion} onChange={(e) => setMarksPerQuestion(Number(e.target.value))} min="1" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Negative Marking</label>
                                                <input type="number" value={negativeMarking} onChange={(e) => setNegativeMarking(Number(e.target.value))} min="0" step="0.25" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Limit (minutes) *</label>
                                                <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} min="1" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Passing Percentage (%)</label>
                                                <input type="number" value={passingPercentage} onChange={(e) => setPassingPercentage(Number(e.target.value))} min="0" max="100" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center">
                                                <input type="checkbox" checked={allowRetake} onChange={(e) => setAllowRetake(e.target.checked)} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Allow Retakes</span>
                                            </label>
                                            {allowRetake && (
                                                <div className="flex items-center gap-2">
                                                    <label className="text-sm text-gray-700 dark:text-gray-300">Max Attempts:</label>
                                                    <input type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} min="1" className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ── Step 3: Questions ── */}
                                {step === 3 && (
                                    <div className="space-y-6">
                                        {/* Question Navigation */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {questions.map((_, index) => (
                                                    <button key={index} onClick={() => setCurrentQuestionIndex(index)}
                                                        className={`w-10 h-10 rounded font-semibold transition-all ${currentQuestionIndex === index ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                                                        {index + 1}
                                                    </button>
                                                ))}
                                                <button onClick={addQuestion} className="w-10 h-10 rounded bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 flex items-center justify-center">
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsPreviewOpen(true)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-sm font-semibold transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Live Preview
                                                </button>
                                                {questions.length > 1 && (
                                                    <button onClick={() => removeQuestion(currentQuestionIndex)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {currentQuestion && (
                                            <div className="space-y-5">
                                                {/* ── Question Type Selector ── */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Question Type</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {([
                                                            { value: 'text', label: 'Text / MCQ', icon: FileText },
                                                            { value: 'image', label: 'Text + Image', icon: Image },
                                                            { value: 'match', label: 'Match the Following', icon: ArrowLeftRight },
                                                        ] as { value: QuizQuestion['questionType']; label: string; icon: any }[]).map(({ value, label, icon: Icon }) => (
                                                            <button
                                                                key={value}
                                                                type="button"
                                                                onClick={() => changeQuestionType(currentQuestionIndex, value)}
                                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${currentQuestion.questionType === value ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300'}`}
                                                            >
                                                                <Icon className="w-4 h-4" />
                                                                {label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* ── Question Text ── */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Question {currentQuestionIndex + 1} *
                                                    </label>
                                                    <ScientificEditor
                                                        value={currentQuestion.questionText || ''}
                                                        onChange={(html) => updateQuestion(currentQuestionIndex, { questionText: html })}
                                                        placeholder="Enter question text (supports scientific formatting, chemical equations, and inline diagrams)"
                                                        minHeight="120px"
                                                    />
                                                </div>

                                                {/* ── Question Image Upload (for all question types) ── */}
                                                <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                            <Image className="w-4 h-4" />
                                                            Question Image <span className="text-gray-400 font-normal">(optional)</span>
                                                        </label>
                                                        <label className="cursor-pointer">
                                                            <input
                                                                type="file"
                                                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) handleQuestionImageUpload(currentQuestionIndex, file);
                                                                    e.target.value = '';
                                                                }}
                                                            />
                                                            <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-sm font-medium transition-colors">
                                                                <Upload className="w-3.5 h-3.5" />
                                                                Upload Image
                                                            </span>
                                                        </label>
                                                    </div>
                                                    {currentQuestion.questionImage ? (
                                                        <div className="relative">
                                                            <img src={currentQuestion.questionImage} alt="Question" className="max-h-48 rounded-lg border border-gray-200 dark:border-gray-700 object-contain bg-gray-50 dark:bg-gray-800" />
                                                            <button
                                                                type="button"
                                                                onClick={() => updateQuestion(currentQuestionIndex, { questionImage: '' })}
                                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-gray-400 dark:text-gray-500">Attach a diagram, graph, or illustration (JPEG, PNG, GIF, WebP — max 5MB)</p>
                                                    )}
                                                </div>

                                                {/* ── MCQ Options (for text/image/formula/diagram types) ── */}
                                                {currentQuestion.questionType !== 'match' && (
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Options *</label>
                                                            <button onClick={() => addOption(currentQuestionIndex)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                                                                <Plus className="w-3.5 h-3.5" /> Add Option
                                                            </button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {currentQuestion.options?.map((option, optIndex) => (
                                                                <div key={option.id} className={`flex items-center gap-2 p-2 rounded-lg border ${currentQuestion.correctAnswer === option.id ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 'border-gray-200 dark:border-gray-700'}`}>
                                                                    <input
                                                                        type="radio"
                                                                        name={`question-${currentQuestionIndex}`}
                                                                        checked={currentQuestion.correctAnswer === option.id}
                                                                        onChange={() => updateQuestion(currentQuestionIndex, { correctAnswer: option.id })}
                                                                        className="w-4 h-4 text-indigo-600 flex-shrink-0"
                                                                        title="Mark as correct answer"
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <ScientificEditor
                                                                            value={option.text}
                                                                            onChange={(html) => updateOption(currentQuestionIndex, option.id, html)}
                                                                            placeholder={`Option ${optIndex + 1}`}
                                                                            minHeight="44px"
                                                                            compact
                                                                        />
                                                                    </div>
                                                                    {currentQuestion.options && currentQuestion.options.length > 2 && (
                                                                        <button onClick={() => removeOption(currentQuestionIndex, option.id)} className="text-red-500 hover:text-red-700 flex-shrink-0">
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">🔘 Click the radio button to mark the correct answer (highlighted in green)</p>
                                                    </div>
                                                )}

                                                {/* ── Match the Following Pairs ── */}
                                                {currentQuestion.questionType === 'match' && (
                                                    <div>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                                <ArrowLeftRight className="w-4 h-4" />
                                                                Match Pairs *
                                                            </label>
                                                            <button onClick={() => addMatchPair(currentQuestionIndex)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                                                                <Plus className="w-3.5 h-3.5" /> Add Pair
                                                            </button>
                                                        </div>

                                                        {/* Column headers */}
                                                        <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 mb-2 px-1">
                                                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center bg-blue-50 dark:bg-blue-950 rounded py-1">Column A (Left)</div>
                                                            <div></div>
                                                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center bg-green-50 dark:bg-green-950 rounded py-1">Column B (Right)</div>
                                                            <div></div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            {(currentQuestion.matchPairs || []).map((pair, pairIndex) => (
                                                                // KEY FIX: use pair.id (stable UUID) NOT pairIndex (array index)
                                                                // Using index causes React to reconcile wrong elements when
                                                                // a pair in the middle is deleted, silently dropping siblings.
                                                                <div key={pair.id || `fallback-${pairIndex}`} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
                                                                    <div className="min-w-0">
                                                                        <ScientificEditor
                                                                            value={pair.left}
                                                                            onChange={(html) => updateMatchPair(currentQuestionIndex, pairIndex, 'left', html)}
                                                                            placeholder={`Item ${pairIndex + 1}`}
                                                                            minHeight="44px"
                                                                            compact
                                                                        />
                                                                    </div>
                                                                    <ArrowLeftRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                                    <div className="min-w-0">
                                                                        <ScientificEditor
                                                                            value={pair.right}
                                                                            onChange={(html) => updateMatchPair(currentQuestionIndex, pairIndex, 'right', html)}
                                                                            placeholder={`Match ${pairIndex + 1}`}
                                                                            minHeight="44px"
                                                                            compact
                                                                        />
                                                                    </div>
                                                                    {(currentQuestion.matchPairs || []).length > 2 && (
                                                                        <button onClick={() => removeMatchPair(currentQuestionIndex, pairIndex)} className="text-red-500 hover:text-red-700">
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                            ℹ️ Students will see Column A items in order and must select the correct Column B match from a dropdown. Partial marks are awarded per correct pair.
                                                        </p>
                                                    </div>
                                                )}

                                                {/* ── Explanation ── */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Explanation *</label>
                                                    <ScientificEditor
                                                        value={currentQuestion.explanation || ''}
                                                        onChange={(html) => updateQuestion(currentQuestionIndex, { explanation: html })}
                                                        placeholder="Explain the correct answer (shown after submission)"
                                                        minHeight="96px"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Step 4: Review ── */}
                                {step === 4 && (
                                    <div className="space-y-6">
                                        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                                            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Quiz Summary</h3>
                                            <div className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
                                                <p><strong>Title:</strong> {title}</p>
                                                <p><strong>Questions:</strong> {questions.length}</p>
                                                <p><strong>Time Limit:</strong> {timeLimit} minutes</p>
                                                <p><strong>Marks:</strong> {marksPerQuestion} per question</p>
                                                {negativeMarking > 0 && (<p><strong>Negative Marking:</strong> -{negativeMarking}</p>)}
                                                <p><strong>Total Marks:</strong> {questions.length * marksPerQuestion}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Questions Preview</h3>
                                            <div className="space-y-4">
                                                {questions.map((q, index) => (
                                                    <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                                        <div className="flex items-start gap-2 mb-2">
                                                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 flex-shrink-0">{index + 1}.</span>
                                                            <div className="font-medium text-gray-900 dark:text-white flex-1">
                                                                <RichTextDisplay content={q.questionText || ''} />
                                                            </div>
                                                        </div>
                                                        {q.questionImage && (
                                                            <img src={q.questionImage} alt="Question" className="max-h-32 rounded border border-gray-200 dark:border-gray-600 mb-2 ml-5" />
                                                        )}
                                                        {q.questionType === 'match' ? (
                                                            <div className="ml-5 space-y-2">
                                                                {(q.matchPairs || []).map((pair, pi) => (
                                                                    <div key={pair.id || `preview-${pi}`} className="text-sm text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-1.5">
                                                                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                                                                            <RichTextDisplay content={pair.left} />
                                                                        </span>
                                                                        <span className="mx-2">→</span>
                                                                        <span className="text-green-600 dark:text-green-400 font-medium">
                                                                            <RichTextDisplay content={pair.right} />
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2 ml-5">
                                                                {q.options?.map((opt) => (
                                                                    <div key={opt.id} className={`text-sm flex items-start gap-1.5 ${q.correctAnswer === opt.id ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                                                                        <span>{q.correctAnswer === opt.id ? '✓ ' : '○ '}</span>
                                                                        <div className="flex-1">
                                                                            <RichTextDisplay content={opt.text} />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            {/* Navigation Buttons */}
                            <div className="flex items-center justify-between">
                                <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    <ChevronLeft className="w-5 h-5" /> Previous
                                </button>
                                <div className="flex gap-2">
                                    {step === 4 ? (
                                        <>
                                            <button onClick={() => handleSave(false)} disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50">
                                                <Save className="w-5 h-5" /> Save as Draft
                                            </button>
                                            <button onClick={() => handleSave(true)} disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
                                                <Send className="w-5 h-5" /> {loading ? 'Publishing...' : 'Publish Quiz'}
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={handleNext} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                                            Next <ChevronRight className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Live Preview Modal */}
            {currentQuestion && (
                <LivePreview
                    question={currentQuestion}
                    questionNumber={currentQuestionIndex + 1}
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                />
            )}
        </div>
    );
};

export default QuizEditor;
