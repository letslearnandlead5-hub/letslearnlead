import React, { useEffect, useState, useRef, useCallback } from 'react';
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
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    PenLine,
} from 'lucide-react';
import { createQuiz, getQuizById, updateQuiz, saveDraft, lockQuiz, unlockQuiz, publishQuiz } from '../../services/quizService';
import { quizCategoryService } from '../../services/quizCategoryService';
import type { Quiz, QuizQuestion, QuestionOption, MatchPair, Subject, QuizCategory } from '../../types';
import toast from 'react-hot-toast';
import AdminHeader from '../../components/admin/AdminHeader';
import { useAuthStore } from '../../store/useAuthStore';
import ScientificEditor, { stripHtml } from '../../components/quiz/ScientificEditor';
import RichTextDisplay from '../../components/quiz/RichTextDisplay';
import LivePreview from '../../components/quiz/LivePreview';
import { generatePairId, normalizeMatchPairs } from '../../utils/htmlUtils';
import api from '../../services/api';

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTimeAgo(date: Date | null): string {
    if (!date) return '';
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    if (s < 5) return 'just now';
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
}

const QuizEditor: React.FC = () => {
    const { id: quizId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [courses, setCourses] = useState<any[]>([]);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Draft / publish state
    const [quizStatus, setQuizStatus] = useState<'draft' | 'published' | 'archived'>('draft');
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [lastSavedAgo, setLastSavedAgo] = useState('');
    const [currentQuizId, setCurrentQuizId] = useState<string | null>(quizId || null);
    const [concurrentEditor, setConcurrentEditor] = useState<{ adminName: string; lockedAt: string } | null>(null);
    const [publishErrors, setPublishErrors] = useState<string[]>([]);
    const isSavingRef = useRef(false);

    // Quiz basic info
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [courseId, setCourseId] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [subjectName, setSubjectName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [categoryName, setCategoryName] = useState('');
    const [availableCategories, setAvailableCategories] = useState<QuizCategory[]>([]);

    // Derive subjects for the selected course
    const selectedCourseSubjects: Subject[] = courses.find(c => c._id === courseId)?.subjects || [];

    // Quiz settings
    const [marksPerQuestion, setMarksPerQuestion] = useState(4);
    const [negativeMarking, setNegativeMarking] = useState(0);
    const [timeLimit, setTimeLimit] = useState(30);
    const [passingPercentage, setPassingPercentage] = useState(40);
    const [allowRetake, setAllowRetake] = useState(false);
    const [maxAttempts, setMaxAttempts] = useState(1);

    // Questions
    const [questions, setQuestions] = useState<Partial<QuizQuestion>[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // ── Refs so the autosave interval always reads fresh state ────────────────
    const titleRef = useRef(title);
    const descriptionRef = useRef(description);
    const courseIdRef = useRef(courseId);
    const subjectIdRef = useRef(subjectId);
    const subjectNameRef = useRef(subjectName);
    const categoryIdRef = useRef(categoryId);
    const categoryNameRef = useRef(categoryName);
    const marksPerQuestionRef = useRef(marksPerQuestion);
    const negativeMarkingRef = useRef(negativeMarking);
    const timeLimitRef = useRef(timeLimit);
    const passingPercentageRef = useRef(passingPercentage);
    const allowRetakeRef = useRef(allowRetake);
    const maxAttemptsRef = useRef(maxAttempts);
    const questionsRef = useRef(questions);
    const stepRef = useRef(step);
    const currentQuestionIndexRef = useRef(currentQuestionIndex);
    const currentQuizIdRef = useRef(currentQuizId);
    const isDirtyRef = useRef(isDirty);

    // Keep refs in sync with state on every render
    useEffect(() => { titleRef.current = title; }, [title]);
    useEffect(() => { descriptionRef.current = description; }, [description]);
    useEffect(() => { courseIdRef.current = courseId; }, [courseId]);
    useEffect(() => { subjectIdRef.current = subjectId; }, [subjectId]);
    useEffect(() => { subjectNameRef.current = subjectName; }, [subjectName]);
    useEffect(() => { categoryIdRef.current = categoryId; }, [categoryId]);
    useEffect(() => { categoryNameRef.current = categoryName; }, [categoryName]);

    // Fetch categories when courseId or subjectId changes
    useEffect(() => {
        if (courseId) {
            quizCategoryService.getCategories(courseId, subjectId || undefined)
                .then(cats => setAvailableCategories(cats))
                .catch(() => setAvailableCategories([]));
        } else {
            setAvailableCategories([]);
        }
    }, [courseId, subjectId]);
    useEffect(() => { marksPerQuestionRef.current = marksPerQuestion; }, [marksPerQuestion]);
    useEffect(() => { negativeMarkingRef.current = negativeMarking; }, [negativeMarking]);
    useEffect(() => { timeLimitRef.current = timeLimit; }, [timeLimit]);
    useEffect(() => { passingPercentageRef.current = passingPercentage; }, [passingPercentage]);
    useEffect(() => { allowRetakeRef.current = allowRetake; }, [allowRetake]);
    useEffect(() => { maxAttemptsRef.current = maxAttempts; }, [maxAttempts]);
    useEffect(() => { questionsRef.current = questions; }, [questions]);
    useEffect(() => { stepRef.current = step; }, [step]);
    useEffect(() => { currentQuestionIndexRef.current = currentQuestionIndex; }, [currentQuestionIndex]);
    useEffect(() => { currentQuizIdRef.current = currentQuizId; }, [currentQuizId]);
    useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);

    // ── Dirty tracking helpers ────────────────────────────────────────────────
    const markDirty = useCallback(() => setIsDirty(true), []);

    // ── "Last saved X ago" ticker ─────────────────────────────────────────────
    useEffect(() => {
        const t = setInterval(() => setLastSavedAgo(formatTimeAgo(lastSavedAt)), 1000);
        return () => clearInterval(t);
    }, [lastSavedAt]);

    // ── beforeunload guard ────────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (isDirtyRef.current) { e.preventDefault(); e.returnValue = ''; }
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, []);

    // ── 30-second autosave (stable interval — no stale closures) ─────────────
    useEffect(() => {
        const interval = setInterval(() => {
            if (isDirtyRef.current && !isSavingRef.current) {
                performSaveFromRefs(false, true);
            }
        }, 30_000);
        return () => clearInterval(interval);
    }, []); // empty deps — interval runs once, reads from refs

    // ── Lock on mount, unlock on unmount ──────────────────────────────────────
    useEffect(() => {
        if (!currentQuizId) return;
        lockQuiz(currentQuizId).catch(() => {/* ignore if lock fails */});
        return () => { unlockQuiz(currentQuizId).catch(() => {}); };
    }, [currentQuizId]);

    useEffect(() => {
        fetchCourses();
        if (quizId) {
            loadQuiz();
        }
    }, [quizId]);

    const fetchCourses = async () => {
        try {
            // Use the shared api instance (auto-attaches token + handles refresh)
            // Previously used raw fetch() with localStorage.getItem('token') which is
            // the WRONG key — Zustand stores it under 'auth-storage', not 'token'.
            const response: any = await api.get('/courses');
            setCourses(response.data || []);
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
            setTitle(quiz.title || '');
            setDescription(quiz.description || '');
            setCourseId(quiz.courseId || '');
            setSubjectId(quiz.subjectId || '');
            setSubjectName(quiz.subjectName || '');
            setCategoryId(quiz.categoryId || '');
            setCategoryName(quiz.categoryName || '');
            const targetMarks = quiz.settings?.marksPerQuestion || 4;
            const targetNegative = quiz.settings?.negativeMarking || 0;
            setMarksPerQuestion(targetMarks);
            setNegativeMarking(targetNegative);
            setTimeLimit(quiz.settings?.timeLimit || 30);
            setPassingPercentage(quiz.settings?.passingPercentage || 40);
            setAllowRetake(quiz.settings?.allowRetake || false);
            setMaxAttempts(quiz.settings?.maxAttempts || 1);
            setQuestions((quiz.questions || []).map((q: QuizQuestion) => ({
                ...q,
                marks: targetMarks,
                negativeMarks: targetNegative,
            })));
            // Restore draft status
            setQuizStatus(quiz.status || 'draft');
            // Restore wizard position from draftMeta
            if (quiz.draftMeta?.currentStep) setStep(quiz.draftMeta.currentStep);
            if (quiz.draftMeta?.currentQuestionIndex !== undefined) setCurrentQuestionIndex(quiz.draftMeta.currentQuestionIndex);
            if (quiz.draftMeta?.lastAutosavedAt) setLastSavedAt(new Date(quiz.draftMeta.lastAutosavedAt));
            // Concurrency check
            if (quiz.lockedBy && quiz.lockedBy.adminId !== (user as any)?._id && quiz.lockedBy.adminId !== user?.id) {
                const lockAge = Date.now() - new Date(quiz.lockedBy.lockedAt).getTime();
                if (lockAge < 5 * 60 * 1000) {
                    setConcurrentEditor({ adminName: quiz.lockedBy.adminName, lockedAt: quiz.lockedBy.lockedAt });
                }
            }
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
        setTimeout(() => setCurrentQuestionIndex(questions.length), 0);
        markDirty();
    };

    const removeQuestion = (index: number) => {
        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);
        if (currentQuestionIndex >= newQuestions.length && currentQuestionIndex > 0) {
            setCurrentQuestionIndex(newQuestions.length - 1);
        }
        markDirty();
    };

    const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
        setQuestions(prev => {
            const copy = [...prev];
            copy[index] = { ...copy[index], ...updates };
            return copy;
        });
        markDirty();
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
                if (!marksPerQuestion || marksPerQuestion <= 0) { toast.error('Marks per question must be greater than 0'); return false; }
                if (negativeMarking === undefined || negativeMarking === null || isNaN(negativeMarking) || negativeMarking < 0) { toast.error('Negative marking must be 0 or greater'); return false; }
                if (!timeLimit || timeLimit <= 0) { toast.error('Time limit must be greater than 0'); return false; }
                if (passingPercentage === undefined || passingPercentage === null || isNaN(passingPercentage) || passingPercentage < 0 || passingPercentage > 100) { toast.error('Passing percentage must be between 0 and 100%'); return false; }
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

    // ── Build payload from REFS (used by autosave interval) ──────────────────
    const buildPayloadFromRefs = (publish: boolean) => ({
        title: titleRef.current,
        description: descriptionRef.current,
        courseId: courseIdRef.current || undefined,
        subjectId: subjectIdRef.current || undefined,
        subjectName: subjectNameRef.current || undefined,
        categoryId: categoryIdRef.current || undefined,
        categoryName: categoryNameRef.current || undefined,
        settings: {
            marksPerQuestion: marksPerQuestionRef.current,
            negativeMarking: negativeMarkingRef.current,
            timeLimit: timeLimitRef.current,
            passingPercentage: passingPercentageRef.current,
            allowRetake: allowRetakeRef.current,
            maxAttempts: maxAttemptsRef.current,
        },
        questions: (questionsRef.current as QuizQuestion[]).map((q) => ({
            ...q,
            marks: marksPerQuestionRef.current || 4,
            negativeMarks: negativeMarkingRef.current || 0,
            matchPairs: q.questionType === 'match' ? normalizeMatchPairs(q.matchPairs || []) : [],
        })),
        status: publish ? 'published' as const : 'draft' as const,
        draftMeta: {
            currentStep: stepRef.current,
            currentQuestionIndex: currentQuestionIndexRef.current,
        },
    });

    // ── Build quiz payload from STATE (used by manual saves) ──────────────────
    const buildQuizPayload = (publish: boolean) => ({
        title,
        description,
        courseId: courseId || undefined,
        subjectId: subjectId || undefined,
        subjectName: subjectName || undefined,
        categoryId: categoryId || undefined,
        categoryName: categoryName || undefined,
        settings: { marksPerQuestion, negativeMarking, timeLimit, passingPercentage, allowRetake, maxAttempts },
        questions: (questions as QuizQuestion[]).map((q) => ({
            ...q,
            marks: marksPerQuestion || 4,
            negativeMarks: negativeMarking || 0,
            matchPairs: q.questionType === 'match' ? normalizeMatchPairs(q.matchPairs || []) : [],
        })),
        status: publish ? 'published' as const : 'draft' as const,
        draftMeta: {
            currentStep: step,
            currentQuestionIndex,
        },
    });

    // ── Perform save from REFS (called by autosave interval — no stale closure) ──
    const performSaveFromRefs = async (publish: boolean, autosave = false) => {
        if (isSavingRef.current) return;
        isSavingRef.current = true;
        setIsSaving(true);

        try {
            const payload: any = { ...buildPayloadFromRefs(publish), autosave };
            let id = currentQuizIdRef.current;

            if (!id) {
                const newQuiz = await createQuiz(payload);
                id = newQuiz._id || newQuiz.id || null;
                if (id) {
                    setCurrentQuizId(id);
                    currentQuizIdRef.current = id;
                    navigate(`/admin/quizzes/edit/${id}/`, { replace: true });
                    lockQuiz(id).catch(() => {});
                }
            } else {
                await saveDraft(id, payload);
            }

            setLastSavedAt(new Date());
            setIsDirty(false);
            isDirtyRef.current = false;
            if (!autosave) toast.success('Draft saved ✓');
        } catch (err: any) {
            console.warn('[AUTOSAVE] Failed:', err?.message || err);
            if (!autosave) toast.error('Failed to save draft');
        } finally {
            isSavingRef.current = false;
            setIsSaving(false);
        }
    };

    // ── Perform save (draft or publish) — called by manual buttons ────────────
    const performSave = async (publish: boolean, autosave = false) => {
        if (isSavingRef.current) return;
        isSavingRef.current = true;
        setIsSaving(true);

        try {
            const payload: any = { ...buildQuizPayload(publish), autosave };

            if (publish) {
                // Client-side pre-flight publish validation
                const errors: string[] = [];
                if (!title.trim()) errors.push('Quiz title is required');
                if (!description.trim()) errors.push('Quiz description is required');
                if (!courseId) errors.push('Course selection is required');
                if (!marksPerQuestion || marksPerQuestion <= 0) errors.push('Marks per question must be > 0');
                if (!timeLimit || timeLimit <= 0) errors.push('Time limit must be > 0');
                if (questions.length === 0) errors.push('At least one question is required');
                questions.forEach((q, i) => {
                    const isHtmlEmpty = (h?: string) => !h || (!h.includes('<img') && !h.replace(/<[^>]*>/g, '').trim());
                    if (isHtmlEmpty(q.questionText)) errors.push(`Q${i+1}: Text is required`);
                    if (q.questionType === 'match') {
                        if ((q.matchPairs || []).length < 2) errors.push(`Q${i+1}: Needs ≥2 match pairs`);
                    } else {
                        if ((q.options || []).length < 2) errors.push(`Q${i+1}: Needs ≥2 options`);
                        if (!q.correctAnswer) errors.push(`Q${i+1}: Correct answer required`);
                    }
                    if (isHtmlEmpty(q.explanation)) errors.push(`Q${i+1}: Explanation required`);
                });
                if (errors.length > 0) {
                    setPublishErrors(errors);
                    return;
                }
            }

            let id = currentQuizId;
            if (!id) {
                // Create new draft
                const newQuiz = await createQuiz(payload);
                id = newQuiz._id || newQuiz.id || null;
                if (id) {
                    setCurrentQuizId(id);
                    navigate(`/admin/quizzes/edit/${id}/`, { replace: true });
                    lockQuiz(id).catch(() => {});
                }
            } else {
                if (publish) {
                    await publishQuiz(id, true);
                } else {
                    await saveDraft(id, payload);
                }
            }

            setLastSavedAt(new Date());
            setIsDirty(false);

            if (publish) {
                setQuizStatus('published');
                toast.success('Quiz published successfully! 🎉');
                navigate('/admin/quizzes/');
            } else if (!autosave) {
                setQuizStatus('draft');
                toast.success('Draft saved ✓');
            }
        } catch (error: any) {
            const msgs: string[] = error.response?.data?.errors;
            if (msgs?.length) {
                setPublishErrors(msgs);
            } else {
                if (!autosave) toast.error(error.response?.data?.message || 'Failed to save quiz');
                else console.warn('[AUTOSAVE] Failed:', error.message);
            }
        } finally {
            isSavingRef.current = false;
            setIsSaving(false);
        }
    };

    const handleSave = (publish: boolean) => performSave(publish);

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
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                            {currentQuizId ? 'Edit Quiz' : 'Create Quiz'}
                                        </h1>
                                        {/* Autosave status bar */}
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                quizStatus === 'published' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                                                quizStatus === 'archived' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' :
                                                'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                                            }`}>
                                                <PenLine className="w-3 h-3" />
                                                {quizStatus === 'published' ? 'Published' : quizStatus === 'archived' ? 'Archived' : 'Draft'}
                                            </span>
                                            {isSaving ? (
                                                <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                                                    <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                                                </span>
                                            ) : lastSavedAt ? (
                                                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                    <CheckCircle2 className="w-3 h-3 text-green-500" /> Saved {lastSavedAgo}
                                                </span>
                                            ) : isDirty ? (
                                                <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                                    <AlertCircle className="w-3 h-3" /> Unsaved changes
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                    {/* Quick actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => performSave(false)}
                                            disabled={isSaving}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Save Draft
                                        </button>
                                        <button
                                            onClick={() => performSave(true)}
                                            disabled={isSaving}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                        >
                                            <Send className="w-4 h-4" />
                                            Publish Quiz
                                        </button>
                                    </div>
                                </div>

                                {/* Concurrency warning */}
                                {concurrentEditor && (
                                    <div className="mt-3 flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <div>
                                            <span className="font-medium">{concurrentEditor.adminName}</span> is also editing this quiz.
                                            <span className="ml-1 text-yellow-600 dark:text-yellow-400 text-xs">Changes may conflict.</span>
                                        </div>
                                        <button onClick={() => setConcurrentEditor(null)} className="ml-auto shrink-0"><X className="w-4 h-4" /></button>
                                    </div>
                                )}
                            </div>

                            {/* Progress Steps */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between">
                                    {['Basic Info', 'Settings', 'Questions', 'Review'].map((label, index) => {
                                        const targetStep = index + 1;
                                        return (
                                            <div
                                                key={index}
                                                onClick={() => {
                                                    if (targetStep < step) {
                                                        setStep(targetStep);
                                                    } else if (targetStep > step) {
                                                        for (let s = 1; s < targetStep; s++) {
                                                            if (!validateStep(s)) return;
                                                        }
                                                        setStep(targetStep);
                                                    }
                                                }}
                                                className={`flex-1 ${index < 3 ? 'mr-2' : ''} cursor-pointer`}
                                            >
                                                <div className={`flex items-center ${step > index + 1 ? 'text-green-600' : step === index + 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step > index + 1 ? 'bg-green-100 dark:bg-green-900' : step === index + 1 ? 'bg-indigo-100 dark:bg-indigo-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                                        {index + 1}
                                                    </div>
                                                    <span className="ml-2 text-sm font-medium hidden sm:block">{label}</span>
                                                </div>
                                                {index < 3 && (<div className={`h-1 mt-2 rounded ${step > index + 1 ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}`} />)}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Question progress bar — visible on step 3 */}
                                {step === 3 && questions.length > 0 && (() => {
                                    const completed = questions.filter(q =>
                                        q.questionText && q.questionText.trim() !== '' &&
                                        (q.questionType === 'match' ? (q.matchPairs || []).length >= 2 : (q.options || []).length >= 2 && !!q.correctAnswer) &&
                                        q.explanation && q.explanation.trim() !== ''
                                    ).length;
                                    const pct = Math.round((completed / questions.length) * 100);
                                    return (
                                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-lg">
                                            <div className="flex items-center justify-between mb-1 text-sm">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Questions: <span className="text-indigo-600">{completed}</span> / {questions.length} Complete</span>
                                                <span className="text-gray-500 dark:text-gray-400">{pct}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-2 bg-indigo-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Step Content */}
                            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">

                                {/* ── Step 1: Basic Info ── */}
                                {step === 1 && (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quiz Title *</label>
                                            <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); markDirty(); }} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" placeholder="Enter quiz title" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                                            <textarea value={description} onChange={(e) => { setDescription(e.target.value); markDirty(); }} rows={4} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" placeholder="Enter quiz description" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course *</label>
                                            <select
                                                value={courseId}
                                                onChange={(e) => {
                                                    setCourseId(e.target.value);
                                                    setSubjectId('');
                                                    setSubjectName('');
                                                    markDirty();
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
                                                        setCategoryId('');
                                                        setCategoryName('');
                                                        markDirty();
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

                                        {/* Quiz Category Selection */}
                                        {courseId && (
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Quiz Category (Optional)
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => window.open('/admin/quiz-categories/', '_blank')}
                                                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1"
                                                    >
                                                        + Manage Categories
                                                    </button>
                                                </div>
                                                <select
                                                    value={categoryId}
                                                    onChange={(e) => {
                                                        const cat = availableCategories.find(c => c._id === e.target.value);
                                                        setCategoryId(e.target.value);
                                                        setCategoryName(cat?.name || '');
                                                        markDirty();
                                                    }}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                                >
                                                    <option value="">General (No Category)</option>
                                                    {availableCategories.map((cat) => (
                                                        <option key={cat._id} value={cat._id}>
                                                            {cat.icon ? `${cat.icon} ` : ''}{cat.name} {cat.subjectId ? '(Subject-specific)' : '(Course-wide)'}
                                                        </option>
                                                    ))}
                                                </select>
                                                {availableCategories.length === 0 && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        No category created yet for this course/subject. Click "+ Manage Categories" above to add categories like Basic, Conceptual, PYQ, etc.
                                                    </p>
                                                )}
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
                                                <input
                                                    type="number"
                                                    value={marksPerQuestion}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        setMarksPerQuestion(val);
                                                        setQuestions(prev => prev.map(q => ({ ...q, marks: val })));
                                                        markDirty();
                                                    }}
                                                    min="1"
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Negative Marking</label>
                                                <input
                                                    type="number"
                                                    value={negativeMarking}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        setNegativeMarking(val);
                                                        setQuestions(prev => prev.map(q => ({ ...q, negativeMarks: val })));
                                                        markDirty();
                                                    }}
                                                    min="0"
                                                    step="0.25"
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Limit (minutes) *</label>
                                                <input type="number" value={timeLimit} onChange={(e) => { setTimeLimit(Number(e.target.value)); markDirty(); }} min="1" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Passing Percentage (%)</label>
                                                <input type="number" value={passingPercentage} onChange={(e) => { setPassingPercentage(Number(e.target.value)); markDirty(); }} min="0" max="100" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center">
                                                <input type="checkbox" checked={allowRetake} onChange={(e) => { setAllowRetake(e.target.checked); markDirty(); }} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Allow Retakes</span>
                                            </label>
                                            {allowRetake && (
                                                <div className="flex items-center gap-2">
                                                    <label className="text-sm text-gray-700 dark:text-gray-300">Max Attempts:</label>
                                                    <input type="number" value={maxAttempts} onChange={(e) => { setMaxAttempts(Number(e.target.value)); markDirty(); }} min="1" className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ── Step 3: Questions ── */}
                                {step === 3 && (
                                    <div className="space-y-6">
                                        {questions.length === 0 ? (
                                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-8">
                                                <FileQuestion className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Questions Added Yet</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                                    Quiz Settings: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{marksPerQuestion} marks</span> per question · <span className="font-semibold text-red-600 dark:text-red-400">-{negativeMarking} negative marking</span>
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={addQuestion}
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md hover:shadow-indigo-500/20"
                                                >
                                                    <Plus className="w-4 h-4" /> Add First Question
                                                </button>
                                            </div>
                                        ) : (
                                            <>
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
                                            </>
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
                                                                <RichTextDisplay content={q.questionText || ''} fieldType="question" />
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
                                                                            <RichTextDisplay content={pair.left} fieldType="match" />
                                                                        </span>
                                                                        <span className="mx-2">→</span>
                                                                        <span className="text-green-600 dark:text-green-400 font-medium">
                                                                            <RichTextDisplay content={pair.right} fieldType="match" />
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
                                                                            <RichTextDisplay content={opt.text} fieldType="option" />
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
                                    {/* Save Draft button always visible */}
                                    <button
                                        onClick={() => performSave(false)}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-5 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Save Draft
                                    </button>

                                    {step === 4 ? (
                                        <button onClick={() => performSave(true)} disabled={isSaving} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
                                            <Send className="w-5 h-5" /> {isSaving ? 'Publishing...' : 'Publish Quiz'}
                                        </button>
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

            {/* Publish Validation Error Modal */}
            {publishErrors.length > 0 && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full shadow-2xl">
                        <div className="flex items-start gap-3 mb-4">
                            <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cannot Publish</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Fix these issues before publishing:</p>
                            </div>
                        </div>
                        <ul className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                            {publishErrors.map((err, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                                    <span className="text-red-400 shrink-0">•</span>
                                    {err}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => setPublishErrors([])}
                            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Close &amp; Fix Issues
                        </button>
                    </motion.div>
                </div>
            )}

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
