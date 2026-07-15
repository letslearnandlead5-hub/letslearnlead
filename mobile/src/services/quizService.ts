import api from './api';
import { ENDPOINTS } from '../config/api.config';
import { Quiz, QuizResultItem } from '../types';

export const quizService = {
  /** Get all quizzes available to the logged-in student (based on enrollments) */
  getAvailableQuizzes: async (): Promise<{ success: boolean; count: number; data: Quiz[] }> => {
    const { data } = await api.get(ENDPOINTS.QUIZZES.AVAILABLE);
    return data;
  },

  /** Get quiz preview (rules, settings, previous attempts) — without questions */
  getQuizPreview: async (quizId: string): Promise<{
    success: boolean;
    data: {
      quiz: Quiz;
      attempts: number;
      completedAttempts: number;
      previousResults: QuizResultItem[];
      canAttempt: boolean;
    };
  }> => {
    const { data } = await api.get(ENDPOINTS.QUIZZES.PREVIEW(quizId));
    return data;
  },

  /** Start (or resume) a quiz attempt. Returns the attemptId and full quiz with questions */
  startAttempt: async (quizId: string): Promise<{
    success: boolean;
    data: { attemptId: string; quiz: Quiz; startedAt: string };
  }> => {
    const { data } = await api.post(ENDPOINTS.QUIZZES.START(quizId));
    return data;
  },

  /** Save a single answer during attempt */
  saveAnswer: async (
    attemptId: string,
    questionId: string,
    selectedAnswer: string
  ): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.put(ENDPOINTS.QUIZZES.SAVE_ANSWER(attemptId), {
      questionId,
      selectedAnswer,
    });
    return data;
  },

  /** Submit the entire attempt for evaluation */
  submitAttempt: async (attemptId: string): Promise<{
    success: boolean;
    data: QuizResultItem & { questionResults: any[] };
  }> => {
    const { data } = await api.post(ENDPOINTS.QUIZZES.SUBMIT(attemptId));
    return data;
  },
};
