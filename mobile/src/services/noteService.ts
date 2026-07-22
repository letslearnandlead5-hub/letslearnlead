import api from './api';
import { ENDPOINTS } from '../config/api.config';
import { Note, MyNotesGroup } from '../types';

export const noteService = {
  /** Get all notes accessible to the logged-in student (fileUrl never returned) */
  getNotes: async (params?: {
    courseId?: string;
    subjectId?: string;
    fileType?: string;
    category?: string;
    search?: string;
  }): Promise<{ success: boolean; count: number; data: Note[] }> => {
    const { data } = await api.get(ENDPOINTS.NOTES.LIST, { params });
    return data;
  },

  /** Get notes for a specific course (fileUrl never returned) */
  getNotesByCourse: async (courseId: string): Promise<{ success: boolean; count: number; data: Note[] }> => {
    const { data } = await api.get(ENDPOINTS.NOTES.BY_COURSE(courseId));
    return data;
  },

  /** Get notes for a course & subject (enrollment-gated, fileUrl never returned) */
  getSubjectNotes: async (
    courseId: string,
    subjectId: string,
    params?: {
      search?: string;
      fileType?: string;
      chapterId?: string;
      sort?: 'newest' | 'oldest' | 'alphabetical';
    }
  ): Promise<{
    success: boolean;
    course: { _id: string; title: string };
    subject: { _id: string; name: string };
    totalNotes: number;
    notes: Note[];
  }> => {
    const { data } = await api.get(ENDPOINTS.NOTES.BY_SUBJECT(courseId, subjectId), { params });
    return data;
  },

  /**
   * Issue a short-lived view token for a note.
   * NEVER exposes fileUrl — the backend issues a signed 5-min token.
   * The token is then used in the WebView stream URL.
   */
  getViewToken: async (noteId: string): Promise<{
    success: boolean;
    viewToken: string;
    expiresIn: number;
    noteId: string;
    title: string;
    fileType: string;
  }> => {
    console.log(`[NOTE SERVICE] Requesting view token for noteId=${noteId}`);
    const { data } = await api.get(ENDPOINTS.NOTES.VIEW_TOKEN(noteId));
    console.log(`[NOTE SERVICE] View token received, expires in ${data.expiresIn}s`);
    return data;
  },

  /**
   * Build the stream URL for the WebView.
   * This is a one-time URL with a short-lived token — not a permanent link.
   */
  buildStreamUrl: (noteId: string, viewToken: string): string => {
    return `${api.defaults.baseURL}${ENDPOINTS.NOTES.STREAM(noteId, viewToken)}`;
  },

  /**
   * Get all notes from enrolled courses, grouped by Course → Subject.
   * Used in Profile → My Notes screen.
   */
  getMyNotes: async (params?: { page?: number; limit?: number }): Promise<{
    success: boolean;
    totalNotes: number;
    page: number;
    limit: number;
    grouped: MyNotesGroup[];
  }> => {
    console.log('[NOTE SERVICE] Fetching My Notes');
    const { data } = await api.get(ENDPOINTS.NOTES.MY_NOTES, { params });
    console.log(`[NOTE SERVICE] My Notes: ${data.totalNotes} notes across ${data.grouped?.length} courses`);
    return data;
  },

  /**
   * Log a print event (fire-and-forget, never blocks the UI).
   */
  logPrint: async (noteId: string): Promise<void> => {
    try {
      await api.post(ENDPOINTS.NOTES.PRINT_LOG(noteId));
      console.log(`[NOTE SERVICE] Print logged for noteId=${noteId}`);
    } catch (err) {
      // Silent fail — never block the print action
      console.warn('[NOTE SERVICE] Failed to log print:', err);
    }
  },
};
