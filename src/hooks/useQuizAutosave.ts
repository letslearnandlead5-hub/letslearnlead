import { useEffect, useRef, useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { createQuiz, saveDraft, lockQuiz, unlockQuiz } from '../services/quizService';
import type { QuizQuestion, QuizSettings } from '../types';

interface AutosaveParams {
    quizId: string | null;
    title: string;
    description: string;
    courseId: string;
    subjectId?: string;
    subjectName?: string;
    settings: QuizSettings;
    questions: Partial<QuizQuestion>[];
    currentStep: number;
    currentQuestionIndex: number;
    onDraftCreated: (id: string) => void;
}

interface AutosaveResult {
    isSaving: boolean;
    lastSavedAt: Date | null;
    lastSavedAgo: string;
    isDirty: boolean;
    saveNow: () => Promise<void>;
    markDirty: () => void;
}

function formatTimeAgo(date: Date | null): string {
    if (!date) return '';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
}

export function useQuizAutosave(params: AutosaveParams): AutosaveResult {
    const paramsRef = useRef(params);
    paramsRef.current = params;

    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [lastSavedAgo, setLastSavedAgo] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    const quizIdRef = useRef<string | null>(params.quizId);
    quizIdRef.current = params.quizId;

    const isSavingRef = useRef(false);

    // Update "X seconds ago" display every second
    useEffect(() => {
        const interval = setInterval(() => {
            setLastSavedAgo(formatTimeAgo(lastSavedAt));
        }, 1000);
        return () => clearInterval(interval);
    }, [lastSavedAt]);

    const buildPayload = useCallback(() => {
        const p = paramsRef.current;
        return {
            title: p.title,
            description: p.description,
            courseId: p.courseId || undefined,
            subjectId: p.subjectId || undefined,
            subjectName: p.subjectName || undefined,
            settings: p.settings,
            questions: p.questions,
            status: 'draft' as const,
            draftMeta: {
                currentStep: p.currentStep,
                currentQuestionIndex: p.currentQuestionIndex,
            },
            autosave: true,
        };
    }, []);

    const saveNow = useCallback(async () => {
        if (isSavingRef.current) return;
        isSavingRef.current = true;
        setIsSaving(true);

        try {
            const payload = buildPayload();
            const currentId = quizIdRef.current;

            if (!currentId) {
                // Create a new draft
                const newQuiz = await createQuiz({
                    ...payload,
                    status: 'draft',
                });
                quizIdRef.current = newQuiz._id || newQuiz.id || null;
                if (quizIdRef.current) {
                    paramsRef.current.onDraftCreated(quizIdRef.current);
                    // Try to acquire lock for new draft
                    lockQuiz(quizIdRef.current).catch(() => {/* ignore lock errors */});
                }
            } else {
                await saveDraft(currentId, payload);
            }

            setLastSavedAt(new Date());
            setIsDirty(false);
        } catch (err: any) {
            // Don't crash the editor on autosave failures — just warn
            console.warn('[AUTOSAVE] Failed:', err?.message || err);
            toast.error('Auto-save failed. Your work is still in the editor.', { id: 'autosave-error', duration: 4000 });
        } finally {
            isSavingRef.current = false;
            setIsSaving(false);
        }
    }, [buildPayload]);

    const markDirty = useCallback(() => {
        setIsDirty(true);
    }, []);

    // 30-second autosave interval
    useEffect(() => {
        const interval = setInterval(() => {
            if (isDirty && !isSavingRef.current) {
                saveNow();
            }
        }, 30_000);
        return () => clearInterval(interval);
    }, [isDirty, saveNow]);

    // Release lock on unmount
    useEffect(() => {
        return () => {
            const id = quizIdRef.current;
            if (id) {
                unlockQuiz(id).catch(() => {/* ignore */});
            }
        };
    }, []);

    return { isSaving, lastSavedAt, lastSavedAgo, isDirty, saveNow, markDirty };
}
