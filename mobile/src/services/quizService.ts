import api from './api';
import { ENDPOINTS } from '../config/api.config';
import { Quiz, QuizResultItem } from '../types';

export const quizService = {
  /** Get all quizzes available to the logged-in student (based on enrollments) */
  getAvailableQuizzes: async (): Promise<{ success: boolean; count: number; data: Quiz[] }> => {
    console.log('[QUIZ API] GET Available Quizzes');
    const { data } = await api.get(ENDPOINTS.QUIZZES.AVAILABLE);
    console.log('[QUIZ API RESP] Available Quizzes count:', data?.data?.length);
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
    console.log(`[QUIZ API] GET Preview quizId: ${quizId}`);
    const { data } = await api.get(ENDPOINTS.QUIZZES.PREVIEW(quizId));
    console.log(`[QUIZ API RESP] Preview loaded for: ${data?.data?.quiz?.title}`);
    return data;
  },

  /** Start (or resume) a quiz attempt. Returns the attemptId and full quiz with questions */
  startAttempt: async (quizId: string): Promise<{
    success: boolean;
    data: { attemptId: string; quiz: Quiz; startedAt: string };
  }> => {
    console.log(`[QUIZ API] POST Start attempt quizId: ${quizId}`);
    const { data } = await api.post(ENDPOINTS.QUIZZES.START(quizId));
    console.log(`[QUIZ API RESP] Attempt started/resumed: attemptId=${data?.data?.attemptId}, questionsCount=${data?.data?.quiz?.questions?.length}`);
    return data;
  },

  /** Save a single answer during attempt */
  saveAnswer: async (
    attemptId: string,
    questionId: string,
    selectedAnswer: string
  ): Promise<{ success: boolean; message: string }> => {
    console.log(`[QUIZ API] PUT Save Answer attemptId=${attemptId}, qId=${questionId}`);
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
    console.log(`[QUIZ API] POST Submit attemptId=${attemptId}`);
    const { data } = await api.post(ENDPOINTS.QUIZZES.SUBMIT(attemptId));
    console.log(`[QUIZ API RESP] Submitted successfully score=${data?.data?.marksObtained}`);
    return data;
  },
};

