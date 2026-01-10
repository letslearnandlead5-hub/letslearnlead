import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, Trash2, GripVertical, Video, FileText } from 'lucide-react';
import Button from '../../components/ui/Button';
import type { ISection, ISubsection, IContentItem } from '../../types/course';

interface CourseContentBuilderProps {
    sections: ISection[];
    onChange: (sections: ISection[]) => void;
}

const CourseContentBuilder: React.FC<CourseContentBuilderProps> = ({ sections, onChange }) => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const [expandedSubsections, setExpandedSubsections] = useState<Set<string>>(new Set());

    // Toggle section expansion
    const toggleSection = (sectionId: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(sectionId)) {
            newExpanded.delete(sectionId);
        } else {
            newExpanded.add(sectionId);
        }
        setExpandedSections(newExpanded);
    };

    // Toggle subsection expansion
    const toggleSubsection = (subsectionId: string) => {
        const newExpanded = new Set(expandedSubsections);
        if (newExpanded.has(subsectionId)) {
            newExpanded.delete(subsectionId);
        } else {
            newExpanded.add(subsectionId);
        }
        setExpandedSubsections(newExpanded);
    };

    // Add new section
    const handleAddSection = () => {
        const newSection: ISection = {
            title: `Section ${sections.length + 1}`,
            description: '',
            order: sections.length,
            subsections: []
        };
        onChange([...sections, newSection]);
    };

    // Add subsection to a section
    const handleAddSubsection = (sectionIndex: number) => {
        const newSections = [...sections];
        const newSubsection: ISubsection = {
            title: `Subsection ${newSections[sectionIndex].subsections.length + 1}`,
            description: '',
            order: newSections[sectionIndex].subsections.length,
            content: []
        };
        newSections[sectionIndex].subsections.push(newSubsection);
        onChange(newSections);
    };

    // Add content item to a subsection
    const handleAddContent = (sectionIndex: number, subsectionIndex: number) => {
        const newSections = [...sections];
        const subsection = newSections[sectionIndex].subsections[subsectionIndex];
        const newContent: IContentItem = {
            type: 'video',
            title: `Lecture ${subsection.content.length + 1}`,
            description: '',
            videoUrl: '',
            duration: '0:00',
            order: subsection.content.length,
            isFree: false
        };
        subsection.content.push(newContent);
        onChange(newSections);
    };

    // Update section
    const handleUpdateSection = (sectionIndex: number, field: keyof ISection, value: any) => {
        const newSections = [...sections];
        (newSections[sectionIndex] as any)[field] = value;
        onChange(newSections);
    };

    // Update subsection
    const handleUpdateSubsection = (sectionIndex: number, subsectionIndex: number, field: keyof ISubsection, value: any) => {
        const newSections = [...sections];
        (newSections[sectionIndex].subsections[subsectionIndex] as any)[field] = value;
        onChange(newSections);
    };

    // Update content item
    const handleUpdateContent = (sectionIndex: number, subsectionIndex: number, contentIndex: number, field: keyof IContentItem, value: any) => {
        const newSections = [...sections];
        (newSections[sectionIndex].subsections[subsectionIndex].content[contentIndex] as any)[field] = value;
        onChange(newSections);
    };

    // Delete section
    const handleDeleteSection = (sectionIndex: number) => {
        if (window.confirm('Delete this section and all its content?')) {
            const newSections = sections.filter((_, i) => i !== sectionIndex);
            onChange(newSections);
        }
    };

    // Delete subsection
    const handleDeleteSubsection = (sectionIndex: number, subsectionIndex: number) => {
        if (window.confirm('Delete this subsection and all its content?')) {
            const newSections = [...sections];
            newSections[sectionIndex].subsections = newSections[sectionIndex].subsections.filter((_, i) => i !== subsectionIndex);
            onChange(newSections);
        }
    };

    // Delete content item
    const handleDeleteContent = (sectionIndex: number, subsectionIndex: number, contentIndex: number) => {
        if (window.confirm('Delete this content item?')) {
            const newSections = [...sections];
            newSections[sectionIndex].subsections[subsectionIndex].content =
                newSections[sectionIndex].subsections[subsectionIndex].content.filter((_, i) => i !== contentIndex);
            onChange(newSections);
        }
    };

    const getContentIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="w-4 h-4" />;
            case 'article': return <FileText className="w-4 h-4" />;
            default: return <Video className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Course Content</h3>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={handleAddSection}
                >
                    Add Section
                </Button>
            </div>

            {sections.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400 mb-3">No sections yet</p>
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={handleAddSection}
                    >
                        Add First Section
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {sections.map((section, sectionIndex) => {
                        const sectionId = section._id || `section-${sectionIndex}`;
                        const isExpanded = expandedSections.has(sectionId);

                        return (
                            <div key={sectionId} className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
                                {/* Section Header */}
                                <div className="bg-gray-50 dark:bg-gray-800 p-4">
                                    <div className="flex items-start gap-3">
                                        <button type="button" className="mt-1 text-gray-400 cursor-move">
                                            <GripVertical className="w-5 h-5" />
                                        </button>
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={section.title}
                                                onChange={(e) => handleUpdateSection(sectionIndex, 'title', e.target.value)}
                                                className="w-full px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 font-medium"
                                                placeholder="Section title"
                                            />
                                            <input
                                                type="text"
                                                value={section.description}
                                                onChange={(e) => handleUpdateSection(sectionIndex, 'description', e.target.value)}
                                                className="w-full mt-2 px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                                                placeholder="Section description (optional)"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAddSubsection(sectionIndex)}
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                            <button
                                                type="button"
                                                onClick={() => toggleSection(sectionId)}
                                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                            >
                                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteSection(sectionIndex)}
                                                className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Subsections */}
                                {isExpanded && (
                                    <div className="p-4 space-y-3">
                                        {section.subsections.length === 0 ? (
                                            <div className="text-center py-4 border border-dashed border-gray-300 dark:border-gray-700 rounded">
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No subsections</p>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleAddSubsection(sectionIndex)}
                                                >
                                                    Add Subsection
                                                </Button>
                                            </div>
                                        ) : (
                                            section.subsections.map((subsection, subsectionIndex) => {
                                                const subsectionId = subsection._id || `subsection-${sectionIndex}-${subsectionIndex}`;
                                                const isSubExpanded = expandedSubsections.has(subsectionId);

                                                return (
                                                    <div key={subsectionId} className="border border-gray-200 dark:border-gray-700 rounded">
                                                        {/* Subsection Header */}
                                                        <div className="bg-white dark:bg-gray-900 p-3">
                                                            <div className="flex items-start gap-2">
                                                                <button type="button" className="mt-1 text-gray-400 cursor-move">
                                                                    <GripVertical className="w-4 h-4" />
                                                                </button>
                                                                <div className="flex-1">
                                                                    <input
                                                                        type="text"
                                                                        value={subsection.title}
                                                                        onChange={(e) => handleUpdateSubsection(sectionIndex, subsectionIndex, 'title', e.target.value)}
                                                                        className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-medium"
                                                                        placeholder="Subsection title"
                                                                    />
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleAddContent(sectionIndex, subsectionIndex)}
                                                                    >
                                                                        <Plus className="w-3 h-3" />
                                                                    </Button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleSubsection(subsectionId)}
                                                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                                                    >
                                                                        {isSubExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteSubsection(sectionIndex, subsectionIndex)}
                                                                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Content Items */}
                                                        {isSubExpanded && (<div className="p-3 bg-gray-50 dark:bg-gray-800/50 space-y-2">
                                                            {subsection.content.length === 0 ? (
                                                                <div className="text-center py-2">
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">No content items</p>
                                                                </div>
                                                            ) : (
                                                                subsection.content.map((item, contentIndex) => (
                                                                    <div key={contentIndex} className="bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">
                                                                        <div className="flex items-start gap-2">
                                                                            {getContentIcon(item.type)}
                                                                            <div className="flex-1 space-y-2">
                                                                                <div className="grid grid-cols-2 gap-2">
                                                                                    <select
                                                                                        value={item.type}
                                                                                        onChange={(e) => handleUpdateContent(sectionIndex, subsectionIndex, contentIndex, 'type', e.target.value)}
                                                                                        className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs"
                                                                                    >
                                                                                        <option value="video">Video</option>
                                                                                        <option value="article">Article</option>
                                                                                    </select>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={item.duration || ''}
                                                                                        onChange={(e) => handleUpdateContent(sectionIndex, subsectionIndex, contentIndex, 'duration', e.target.value)}
                                                                                        className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs"
                                                                                        placeholder="Duration (e.g., 10:30)"
                                                                                    />
                                                                                </div>
                                                                                <input
                                                                                    type="text"
                                                                                    value={item.title}
                                                                                    onChange={(e) => handleUpdateContent(sectionIndex, subsectionIndex, contentIndex, 'title', e.target.value)}
                                                                                    className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs"
                                                                                    placeholder="Content title"
                                                                                />
                                                                                {item.type === 'video' && (
                                                                                    <input
                                                                                        type="url"
                                                                                        value={item.videoUrl || ''}
                                                                                        onChange={(e) => handleUpdateContent(sectionIndex, subsectionIndex, contentIndex, 'videoUrl', e.target.value)}
                                                                                        className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs"
                                                                                        placeholder="Video URL"
                                                                                    />
                                                                                )}
                                                                                {item.type === 'article' && (
                                                                                    <textarea
                                                                                        value={item.articleContent || ''}
                                                                                        onChange={(e) => handleUpdateContent(sectionIndex, subsectionIndex, contentIndex, 'articleContent', e.target.value)}
                                                                                        className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs"
                                                                                        placeholder="Article content"
                                                                                        rows={3}
                                                                                    />
                                                                                )}
                                                                                <label className="flex items-center gap-2 text-xs">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={item.isFree}
                                                                                        onChange={(e) => handleUpdateContent(sectionIndex, subsectionIndex, contentIndex, 'isFree', e.target.checked)}
                                                                                        className="rounded"
                                                                                    />
                                                                                    <span className="text-gray-600 dark:text-gray-400">Free preview</span>
                                                                                </label>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDeleteContent(sectionIndex, subsectionIndex, contentIndex)}
                                                                                className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CourseContentBuilder;
