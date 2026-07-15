import api from './api';
import { ENDPOINTS } from '../config/api.config';
import { Note } from '../types';

export const noteService = {
  /** Get all notes accessible to the logged-in student */
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

  /** Get notes for a specific course */
  getNotesByCourse: async (courseId: string): Promise<{ success: boolean; count: number; data: Note[] }> => {
    const { data } = await api.get(ENDPOINTS.NOTES.BY_COURSE(courseId));
    return data;
  },

  /** Get download URL for a note */
  getDownloadUrl: (noteId: string): string => {
    return `${api.defaults.baseURL}${ENDPOINTS.NOTES.DOWNLOAD(noteId)}`;
  },
};
