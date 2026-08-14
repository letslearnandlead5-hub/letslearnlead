import React, { useState, useMemo } from 'react';
import { Search, CheckSquare, Square, X, BookOpen, Layers, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export interface CourseOption {
    _id: string;
    id?: string;
    title: string;
    category?: string;
    subjects?: Array<{
        _id: string;
        name: string;
        icon?: string;
    }>;
}

export interface MultiCourseSelectorProps {
    courses: CourseOption[];
    selectedCourseIds: string[];
    onChange: (courseIds: string[]) => void;
    onCommonSubjectsChange?: (commonSubjects: Array<{ name: string; icon?: string; count: number }>) => void;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    helperText?: string;
}

export const MultiCourseSelector: React.FC<MultiCourseSelectorProps> = ({
    courses,
    selectedCourseIds,
    onChange,
    onCommonSubjectsChange,
    label = 'Select Courses',
    required = true,
    disabled = false,
    helperText,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter courses based on search
    const filteredCourses = useMemo(() => {
        if (!searchQuery.trim()) return courses;
        const q = searchQuery.toLowerCase().trim();
        return courses.filter(
            (c) => c.title.toLowerCase().includes(q) || (c.category && c.category.toLowerCase().includes(q))
        );
    }, [courses, searchQuery]);

    // Map of selected course objects
    const selectedCourses = useMemo(() => {
        const set = new Set(selectedCourseIds);
        return courses.filter((c) => set.has(c._id || (c.id as string)));
    }, [courses, selectedCourseIds]);

    // Calculate common compatible subjects among selected courses
    const commonSubjects = useMemo(() => {
        if (selectedCourses.length === 0) return [];

        const subjectCounts: Record<string, { name: string; icon?: string; count: number }> = {};

        selectedCourses.forEach((course) => {
            const courseSubjects = course.subjects || [];
            const seenInThisCourse = new Set<string>();

            courseSubjects.forEach((sub) => {
                const normName = sub.name.trim();
                const key = normName.toLowerCase();
                if (!seenInThisCourse.has(key)) {
                    seenInThisCourse.add(key);
                    if (!subjectCounts[key]) {
                        subjectCounts[key] = { name: normName, icon: sub.icon || '📚', count: 1 };
                    } else {
                        subjectCounts[key].count += 1;
                    }
                }
            });
        });

        const list = Object.values(subjectCounts).sort((a, b) => b.count - a.count);
        return list;
    }, [selectedCourses]);

    // Notify parent of common subjects when they change
    React.useEffect(() => {
        if (onCommonSubjectsChange) {
            onCommonSubjectsChange(commonSubjects);
        }
    }, [commonSubjects, onCommonSubjectsChange]);

    const handleToggleCourse = (courseId: string) => {
        if (disabled) return;
        const set = new Set(selectedCourseIds);
        if (set.has(courseId)) {
            set.delete(courseId);
        } else {
            set.add(courseId);
        }
        onChange(Array.from(set));
    };

    const handleSelectAll = () => {
        if (disabled) return;
        const allIds = courses.map((c) => c._id || (c.id as string));
        onChange(allIds);
    };

    const handleClearAll = () => {
        if (disabled) return;
        onChange([]);
    };

    const handleRemoveCourse = (courseId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (disabled) return;
        onChange(selectedCourseIds.filter((id) => id !== courseId));
    };

    const allSelected = courses.length > 0 && selectedCourseIds.length === courses.length;

    return (
        <div className="space-y-3">
            {/* Header / Label & Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                    {selectedCourseIds.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            <CheckCircle2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                            {selectedCourseIds.length} {selectedCourseIds.length === 1 ? 'Course' : 'Courses'} Selected
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        disabled={disabled || allSelected}
                        className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-40 disabled:no-underline"
                    >
                        Select All
                    </button>
                    <span className="text-gray-300 dark:text-gray-700">|</span>
                    <button
                        type="button"
                        onClick={handleClearAll}
                        disabled={disabled || selectedCourseIds.length === 0}
                        className="text-xs font-medium text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 disabled:opacity-40"
                    >
                        Clear All
                    </button>
                </div>
            </div>

            {/* Selected Courses Chips Container */}
            {selectedCourses.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 rounded-xl">
                    {selectedCourses.map((course) => {
                        const cId = course._id || (course.id as string);
                        return (
                            <span
                                key={cId}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-gray-800 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 shadow-sm"
                            >
                                <BookOpen className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                <span className="truncate max-w-[150px] sm:max-w-[200px]">{course.title}</span>
                                {!disabled && (
                                    <button
                                        type="button"
                                        onClick={(e) => handleRemoveCourse(cId, e)}
                                        className="hover:text-red-500 focus:outline-none ml-0.5"
                                        title="Remove course"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Search Input Box */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search courses..."
                    disabled={disabled}
                    className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white placeholder-gray-400"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Courses Checkbox Grid / List */}
            <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 p-2 space-y-1 divide-y divide-gray-100 dark:divide-gray-800">
                {filteredCourses.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-500 dark:text-gray-400">
                        {courses.length === 0 ? 'No courses available' : 'No courses match your search'}
                    </div>
                ) : (
                    filteredCourses.map((course) => {
                        const cId = course._id || (course.id as string);
                        const isSelected = selectedCourseIds.includes(cId);
                        const subjectCount = course.subjects?.length || 0;

                        return (
                            <div
                                key={cId}
                                onClick={() => handleToggleCourse(cId)}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                    isSelected
                                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-100 font-medium'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                    {isSelected ? (
                                        <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                                    ) : (
                                        <Square className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                    )}
                                    <span className="text-sm truncate">{course.title}</span>
                                </div>

                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                        {subjectCount} {subjectCount === 1 ? 'subject' : 'subjects'}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Common Subject Compatibility Indicator (Section 4 & 12) */}
            {selectedCourses.length > 1 && (
                <div className="p-3 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-900/50 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-blue-900 dark:text-blue-200">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        Common Subjects Across Selected {selectedCourses.length} Courses:
                    </div>
                    {commonSubjects.filter((s) => s.count === selectedCourses.length).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {commonSubjects
                                .filter((s) => s.count === selectedCourses.length)
                                .map((s) => (
                                    <span
                                        key={s.name}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800"
                                    >
                                        <span>{s.icon}</span>
                                        <span>{s.name}</span>
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                            (In all {selectedCourses.length})
                                        </span>
                                    </span>
                                ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>
                                Note: Selected courses do not share 100% common subjects. Content will only be created for courses containing the chosen subject.
                            </span>
                        </div>
                    )}
                </div>
            )}

            {helperText && <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>}
        </div>
    );
};

export default MultiCourseSelector;
