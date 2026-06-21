import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { courseService } from '../services/courseService';
import { Course, CourseFilters } from '../types';

// ─── State & Context ──────────────────────────────────────────────────────────
interface CourseContextType {
  courses: Course[];
  isLoading: boolean;
  error: string | null;
  filters: CourseFilters;
  fetchCourses: (filters?: CourseFilters) => Promise<void>;
  setFilters: (filters: CourseFilters) => void;
  refreshCourses: () => Promise<void>;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const CourseProvider = ({ children }: { children: ReactNode }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<CourseFilters>({});

  const fetchCourses = useCallback(async (newFilters?: CourseFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const activeFilters = newFilters ?? filters;
      const response = await courseService.getCourses(activeFilters);
      if (response.success) {
        setCourses(response.data || []);
      }
    } catch (err: any) {
      setError(err.userMessage || 'Failed to load courses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const setFilters = useCallback((newFilters: CourseFilters) => {
    setFiltersState(newFilters);
  }, []);

  const refreshCourses = useCallback(async () => {
    await fetchCourses(filters);
  }, [fetchCourses, filters]);

  return (
    <CourseContext.Provider
      value={{ courses, isLoading, error, filters, fetchCourses, setFilters, refreshCourses }}>
      {children}
    </CourseContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useCourses = (): CourseContextType => {
  const context = useContext(CourseContext);
  if (!context) throw new Error('useCourses must be used within a CourseProvider');
  return context;
};
