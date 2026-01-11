import React, { useState } from 'react';
import { X, Upload, File, Trash2, FileText, Edit3, Bold, Italic, List, ListOrdered, Heading1, Heading2 } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface NoteFormProps {
    initialData?: {
        title: string;
        description: string;
        courseId?: string;
        fileType: string;
        category?: string;
        tags?: string[];
        markdownContent?: string;
    };
    courses?: Array<{ _id: string; title: string }>;
    onSubmit: (noteData: any) => void;
    onCancel: () => void;
    isLoading?: boolean;
    isFullPage?: boolean; // New prop to control layout
}

const NoteForm: React.FC<NoteFormProps> = ({
    initialData,
    courses = [],
    onSubmit,
    onCancel,
    isLoading = false,
    isFullPage = false,
}) => {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        courseId: initialData?.courseId || '',
        fileType: initialData?.fileType || 'file',
        category: initialData?.category || '',
        tags: initialData?.tags || [],
    });

    const [tagInput, setTagInput] = useState('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string>('');

    // New states for rich text editor
    const [contentMode, setContentMode] = useState<'upload' | 'write'>(
        initialData?.markdownContent ? 'write' : 'upload'
    );
    const [htmlContent, setHtmlContent] = useState(initialData?.markdownContent || '');

    // Simple formatting functions
    const insertFormatting = (before: string, after: string = '') => {
        const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = htmlContent.substring(start, end);
        const newText = htmlContent.substring(0, start) + before + selectedText + after + htmlContent.substring(end);

        setHtmlContent(newText);

        // Restore cursor position
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, end + before.length);
        }, 0);
    };

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData((prev) => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()],
            }));
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag: string) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((t) => t !== tag),
        }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type - Only PDF and text files
            const allowedTypes = [
                'application/pdf',
                'text/plain'
            ];

            if (!allowedTypes.includes(file.type)) {
                alert('Please upload a valid file (PDF or TXT only)');
                return;
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }

            setUploadedFile(file);
            setFilePreview(file.name);
        }
    };

    const handleRemoveFile = () => {
        setUploadedFile(null);
        setFilePreview('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation based on mode
        if (contentMode === 'upload') {
            if (!uploadedFile) {
                alert('Please upload a file');
                return;
            }

            // Create FormData for file upload
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('courseId', formData.courseId);
            formDataToSend.append('fileType', 'file');
            formDataToSend.append('category', formData.category);
            formDataToSend.append('tags', JSON.stringify(formData.tags));

            // Debug logging
            console.log('Uploading file:', uploadedFile);
            console.log('File details:', {
                name: uploadedFile?.name,
                size: uploadedFile?.size,
                type: uploadedFile?.type
            });

            formDataToSend.append('file', uploadedFile);

            onSubmit(formDataToSend);
        } else {
            // Write mode - send markdown content as FormData
            if (!htmlContent || htmlContent.trim() === '') {
                alert('Please write some content');
                return;
            }

            // Create FormData for markdown content (backend expects FormData)
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('courseId', formData.courseId);
            formDataToSend.append('fileType', 'html');
            formDataToSend.append('category', formData.category);
            formDataToSend.append('tags', JSON.stringify(formData.tags));
            formDataToSend.append('markdownContent', htmlContent);

            onSubmit(formDataToSend);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className={isFullPage ? "px-6 py-4" : "max-h-[70vh] overflow-y-auto px-6 py-4"}>
                <div className="space-y-4">
                    {/* Title */}
                    <Input
                        label="Note Title"
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        required
                        placeholder="Enter note title"
                    />

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Brief description of the note"
                            required
                        />
                    </div>

                    {/* Course Selection */}
                    {courses.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Course
                            </label>
                            <select
                                value={formData.courseId}
                                onChange={(e) => handleChange('courseId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                required
                            >
                                <option value="">Select a course</option>
                                {courses.map((course) => (
                                    <option key={course._id} value={course._id}>
                                        {course.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Category */}
                    <Input
                        label="Category (Optional)"
                        type="text"
                        value={formData.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        placeholder="e.g., Study Guide, Summary, Lecture Notes"
                    />

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tags (Optional)
                        </label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Add tag and press Enter"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                                Add
                            </Button>
                        </div>
                        {formData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {formData.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm"
                                    >
                                        {tag}
                                        <button type="button" onClick={() => handleRemoveTag(tag)}>
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Mode Toggle */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Content Type
                        </label>
                        <div className="flex gap-2 mb-4">
                            <button
                                type="button"
                                onClick={() => setContentMode('upload')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${contentMode === 'upload'
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                    : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                                    }`}
                            >
                                <Upload className="w-5 h-5" />
                                <span className="font-medium">Upload File</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setContentMode('write')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${contentMode === 'write'
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                    : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                                    }`}
                            >
                                <Edit3 className="w-5 h-5" />
                                <span className="font-medium">Write Content</span>
                            </button>
                        </div>

                        {/* Upload Mode */}
                        {contentMode === 'upload' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Upload File
                                </label>

                                {!uploadedFile ? (
                                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="hidden"
                                            accept=".pdf,.txt"
                                            onChange={handleFileUpload}
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className="cursor-pointer flex flex-col items-center gap-3"
                                        >
                                            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                                                <Upload className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Click to upload or drag and drop
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    PDF or TXT files only (Max 10MB)
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                                                    <File className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {filePreview}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRemoveFile}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Write Mode - Simple Text Editor with Markdown */}
                        {contentMode === 'write' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Write Content
                                </label>

                                {/* Formatting Toolbar */}
                                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-t-lg p-2 flex flex-wrap gap-1">
                                    <button
                                        type="button"
                                        onClick={() => insertFormatting('# ', '')}
                                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                        title="Heading 1"
                                    >
                                        <Heading1 className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertFormatting('## ', '')}
                                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                        title="Heading 2"
                                    >
                                        <Heading2 className="w-4 h-4" />
                                    </button>
                                    <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                                    <button
                                        type="button"
                                        onClick={() => insertFormatting('**', '**')}
                                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                        title="Bold"
                                    >
                                        <Bold className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertFormatting('*', '*')}
                                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                        title="Italic"
                                    >
                                        <Italic className="w-4 h-4" />
                                    </button>
                                    <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                                    <button
                                        type="button"
                                        onClick={() => insertFormatting('- ', '')}
                                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                        title="Bullet List"
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertFormatting('1. ', '')}
                                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                        title="Numbered List"
                                    >
                                        <ListOrdered className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Text Editor */}
                                <textarea
                                    id="content-editor"
                                    value={htmlContent}
                                    onChange={(e) => setHtmlContent(e.target.value)}
                                    className="w-full px-4 py-3 border-x border-b border-gray-300 dark:border-gray-700 rounded-b-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm resize-none"
                                    placeholder="Write your note content here using Markdown formatting...&#10;&#10;Examples:&#10;# Heading 1&#10;## Heading 2&#10;**Bold text**&#10;*Italic text*&#10;- Bullet point&#10;1. Numbered list"
                                    rows={15}
                                />

                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Use Markdown formatting: **bold**, *italic*, # headings, - lists
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions - Fixed at bottom */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isLoading}>
                    {isLoading ? 'Saving...' : initialData ? 'Update Note' : 'Create Note'}
                </Button>
            </div>
        </form>
    );
};

export default NoteForm;
