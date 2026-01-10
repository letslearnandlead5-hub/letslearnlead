import { create } from 'zustand';
import type { Quiz, QuizAnswer } from '../types';

interface QuizState {
    currentQuiz: Quiz | null;
    attemptId: string | null;
    answers: Map<string, string>; // questionId -> selectedAnswer
    timeRemaining: number | null; // in seconds
    isTimerRunning: boolean;
    currentQuestionIndex: number;

    // Actions
    setQuiz: (quiz: Quiz, attemptId: string) => void;
    setAnswer: (questionId: string, answer: string) => void;
    getAnswer: (questionId: string) => string | undefined;
    setTimeRemaining: (time: number) => void;
    startTimer: () => void;
    stopTimer: () => void;
    decrementTime: () => void;
    setCurrentQuestionIndex: (index: number) => void;
    nextQuestion: () => void;
    previousQuestion: () => void;
    resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
    currentQuiz: null,
    attemptId: null,
    answers: new Map(),
    timeRemaining: null,
    isTimerRunning: false,
    currentQuestionIndex: 0,

    setQuiz: (quiz, attemptId) => {
        set({
            currentQuiz: quiz,
            attemptId,
            answers: new Map(),
            timeRemaining: quiz.settings.timeLimit * 60, // Convert minutes to seconds
            currentQuestionIndex: 0,
        });
    },

    setAnswer: (questionId, answer) => {
        set((state) => {
            const newAnswers = new Map(state.answers);
            newAnswers.set(questionId, answer);
            return { answers: newAnswers };
        });
    },

    getAnswer: (questionId) => {
        return get().answers.get(questionId);
    },

    setTimeRemaining: (time) => set({ timeRemaining: time }),

    startTimer: () => set({ isTimerRunning: true }),

    stopTimer: () => set({ isTimerRunning: false }),

    decrementTime: () => {
        set((state) => ({
            timeRemaining: state.timeRemaining !== null ? Math.max(0, state.timeRemaining - 1) : null,
        }));
    },

    setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),

    nextQuestion: () => {
        set((state) => ({
            currentQuestionIndex: state.currentQuiz
                ? Math.min(state.currentQuestionIndex + 1, state.currentQuiz.questions.length - 1)
                : state.currentQuestionIndex,
        }));
    },

    previousQuestion: () => {
        set((state) => ({
            currentQuestionIndex: Math.max(0, state.currentQuestionIndex - 1),
        }));
    },

    resetQuiz: () => {
        set({
            currentQuiz: null,
            attemptId: null,
            answers: new Map(),
            timeRemaining: null,
            isTimerRunning: false,
            currentQuestionIndex: 0,
        });
    },
}));
